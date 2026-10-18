import { NextRequest, NextResponse } from "next/server";
import { adminGraphql } from "@/lib/shopifyAdmin";

export const dynamic = "force-dynamic";
// One-time task: apply the Meekitaz look ("A · Ivory & oxblood") to the Shopify checkout. Open /api/admin/branding?key=ADMIN_TASK_KEY&apply=1
// Needs the app scope write_checkout_branding_settings (Dev Dashboard → the "Meekitaz site" app → Access scopes).
const BRANDING = {
  designSystem: {
    colors: {
      global: { brand: "#7E0508", accent: "#7E0508", decorative: "#C4DEEE", success: "#2fa26a", info: "#6fa3e6", warning: "#C29A55", critical: "#B3261E" },
      schemes: {
        scheme1: { base: { background: "#FBF7F1", text: "#1C1A1B", border: "#E6DED3", decorative: "#7E0508", accent: "#7E0508", icon: "#1C1A1B" },
          control: { background: "#FFFFFF", text: "#1C1A1B", border: "#DED5C9", decorative: "#7E0508", accent: "#7E0508", icon: "#1C1A1B", selected: { background: "#FFFFFF", text: "#1C1A1B", border: "#7E0508", decorative: "#7E0508", accent: "#7E0508", icon: "#7E0508" } },
          primaryButton: { background: "#7E0508", text: "#FFFFFF", border: "#7E0508", decorative: "#7E0508", accent: "#FFFFFF", icon: "#FFFFFF", hover: { background: "#5F0406", text: "#FFFFFF", border: "#5F0406", decorative: "#5F0406", accent: "#FFFFFF", icon: "#FFFFFF" } },
          secondaryButton: { background: "#FBF7F1", text: "#1C1A1B", border: "#1C1A1B", decorative: "#1C1A1B", accent: "#1C1A1B", icon: "#1C1A1B", hover: { background: "#F1EBE2", text: "#1C1A1B", border: "#1C1A1B", decorative: "#1C1A1B", accent: "#1C1A1B", icon: "#1C1A1B" } } },
        scheme2: { base: { background: "#FFFFFF", text: "#1C1A1B", border: "#E6DED3", decorative: "#7E0508", accent: "#7E0508", icon: "#1C1A1B" },
          control: { background: "#FFFFFF", text: "#1C1A1B", border: "#DED5C9", decorative: "#7E0508", accent: "#7E0508", icon: "#1C1A1B", selected: { background: "#FFFFFF", text: "#1C1A1B", border: "#7E0508", decorative: "#7E0508", accent: "#7E0508", icon: "#7E0508" } } },
      },
    },
    typography: {
      primary: { shopifyFontGroup: { name: "Inter", baseWeight: 400, loadingStrategy: "SWAP" } },
      secondary: { shopifyFontGroup: { name: "Playfair Display", baseWeight: 400, loadingStrategy: "SWAP" } },
      size: { base: 15, ratio: 1.2 },
    },
    cornerRadius: { small: 8, base: 14, large: 20 },
  },
  customizations: {
    global: { cornerRadius: "BASE", typography: { kerning: "BASE", letterCase: "NONE" } },
    header: { alignment: "START", position: "INLINE" },
    main: { colorScheme: "COLOR_SCHEME1" },
    orderSummary: { colorScheme: "COLOR_SCHEME2" },
    headingLevel1: { typography: { font: "SECONDARY", size: "EXTRA_LARGE", weight: "BASE", letterCase: "NONE" } },
    headingLevel2: { typography: { font: "SECONDARY", size: "LARGE", weight: "BASE", letterCase: "NONE" } },
    headingLevel3: { typography: { font: "SECONDARY", size: "MEDIUM", weight: "BASE" } },
    primaryButton: { cornerRadius: "BASE", blockPadding: "LARGE", inlinePadding: "LARGE", typography: { font: "PRIMARY", size: "SMALL", weight: "BOLD", letterCase: "UPPER", kerning: "LOOSE" } },
    secondaryButton: { cornerRadius: "BASE", typography: { font: "PRIMARY", size: "SMALL", weight: "BOLD", letterCase: "UPPER", kerning: "LOOSE" } },
    control: { cornerRadius: "BASE", border: "FULL", labelPosition: "INSIDE" },
    textField: { typography: { font: "PRIMARY", size: "BASE" } },
    checkbox: { cornerRadius: "SMALL" },
    select: { typography: { font: "PRIMARY" } },
  },
};

export async function GET(req: NextRequest) {
  const key = process.env.ADMIN_TASK_KEY;
  if (!key || req.nextUrl.searchParams.get("key") !== key) return new NextResponse("Not found", { status: 404 });
  try {
    const p = await adminGraphql<{ checkoutProfiles: { nodes: { id: string; name: string; isPublished: boolean }[] } }>(`{ checkoutProfiles(first: 10) { nodes { id name isPublished } } }`);
    const prof = p.checkoutProfiles.nodes.find(x => x.isPublished) || p.checkoutProfiles.nodes[0];
    if (!prof) return NextResponse.json({ error: "no checkout profile" }, { status: 502 });
    if (!req.nextUrl.searchParams.get("apply")) return NextResponse.json({ profile: prof, note: "add &apply=1 to apply the Meekitaz branding" });
    const r = await adminGraphql<{ checkoutBrandingUpsert: { checkoutBranding: unknown; userErrors: { field: string[]; message: string }[] } }>(
      `mutation($id: ID!, $input: CheckoutBrandingInput!) { checkoutBrandingUpsert(checkoutProfileId: $id, checkoutBrandingInput: $input) { checkoutBranding { designSystem { cornerRadius { base } } } userErrors { field message } } }`,
      { id: prof.id, input: BRANDING });
    return NextResponse.json({ profile: prof.name, errors: r.checkoutBrandingUpsert.userErrors, applied: r.checkoutBrandingUpsert.userErrors.length === 0 });
  } catch (e) { return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 502 }); }
}

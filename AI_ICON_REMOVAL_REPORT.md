# AI icon removal report

**Runtime source scan: PASS. Overall UI/UX acceptance: PARTIAL (browser QA blocked).**

## Before → after

| Original occurrence | Decision | Replacement |
|---|---|---|
| LoginScreen: two demo-persona entry icons | Keep demo entry behavior | UsersRound |
| TopBar: demo-persona switcher | Keep persona switching | UsersRound |
| BlockerAndNextAction: next operational action | Keep action and responsible role | ClipboardCheck |
| PWAUpdateBanner: available update notice | Keep explicit update consent | Download; existing RefreshCw retained without idle spinning |
| CreateUserModal, SalesView, SupplyRequestsView, DesignSystemShowcaseView, UsersView, FieldSalesView | Unused imports only | Removed six unused Sparkles imports |

Five rendered instances and six unused imports were present in the supplied source. No complete fictional AI-only assistant control/modal was found, so no operational workflow was removed. No emoji replacements were used. The sales subtitle no longer describes its normal step-by-step form as «هوشمند».

## Broader cleanup

- Removed 235 additional unused Lucide icon imports after the replacements (full list: docs/UNUSED_ICON_IMPORTS_REMOVED.json).
- No additional icon library was installed.
- Removed AI Studio/Gemini setup instructions, unused environment-key placeholders and the obsolete Gemini capability claim in metadata.json. No runtime SDK import or AI API was introduced.
- The unused @google/genai dependency remains in the supplied dependency manifest/lockfile to preserve the locked dependency graph; it is not an application control or runtime import.
- Existing Javadian emblem/PNG variants were inspected as source assets and retained; they are a commodity/drop mark, not a robot, sparkle or fictional assistant. The original asset styling remains an explicit brand-preservation exception.
- Decorative UI shimmer, pulsing indicators and zoom entrance effects were removed; restrained skeleton loading remains.

## Search scope and exclusions

Scanned application TS/TSX, CSS, HTML, SVG, PWA components and public text assets for the requested icon/control names, AI wording, inline SVG and background effects. No requested AI-themed icon/control name remains in runtime source. Ordinary data-generation function names, the Roboto font fallback name, documentation describing removals, lockfile package names and dependency internals are not AI controls. Live appearance was not inspected because browser access was blocked.

## Remaining Lucide import inventory

113 distinct imported icon identifiers remain. Counts below are importing source files, not visible-instance counts.

| Icon | Files |
|---|---|
| Activity | 3 |
| AlertCircle | 12 |
| AlertOctagon | 4 |
| AlertTriangle | 20 |
| ArrowDownLeft | 1 |
| ArrowLeft | 8 |
| ArrowLeftRight | 2 |
| ArrowRight | 8 |
| ArrowRightCircle | 1 |
| ArrowUpRight | 1 |
| Award | 2 |
| BarChart3 | 5 |
| Bell | 5 |
| Boxes | 2 |
| Briefcase | 4 |
| Building | 1 |
| Building2 | 10 |
| Calendar | 4 |
| Camera | 1 |
| Check | 10 |
| CheckCheck | 2 |
| CheckCircle | 2 |
| CheckCircle2 | 24 |
| CheckSquare | 2 |
| ChevronDown | 3 |
| ChevronLeft | 3 |
| ChevronRight | 6 |
| ChevronUp | 1 |
| ClipboardCheck | 1 |
| ClipboardList | 1 |
| Clock | 17 |
| Copy | 2 |
| CreditCard | 8 |
| Database | 5 |
| DollarSign | 1 |
| Download | 4 |
| ExternalLink | 8 |
| Eye | 7 |
| EyeOff | 2 |
| File | 1 |
| FileCheck | 2 |
| FileImage | 1 |
| FilePlus | 1 |
| FileQuestion | 1 |
| FileSpreadsheet | 2 |
| FileText | 12 |
| Filter | 4 |
| GitBranch | 1 |
| HelpCircle | 4 |
| History | 5 |
| Home | 1 |
| Image as ImageIcon | 1 |
| Inbox | 2 |
| Info | 4 |
| KeyRound | 1 |
| Layers | 4 |
| Link2 | 2 |
| List | 1 |
| Loader2 | 1 |
| Lock | 4 |
| LogOut | 1 |
| Mail | 1 |
| Map as MapIcon | 1 |
| MapPin | 10 |
| Menu | 1 |
| MessageSquare | 7 |
| Mic | 1 |
| Monitor | 1 |
| MoreHorizontal | 1 |
| Package | 6 |
| PackageCheck | 2 |
| Palette | 2 |
| PanelRightClose | 1 |
| PanelRightOpen | 1 |
| Paperclip | 3 |
| Phone | 5 |
| PhoneCall | 1 |
| Play | 3 |
| Plus | 17 |
| PlusSquare | 1 |
| Printer | 3 |
| Receipt | 1 |
| RefreshCw | 5 |
| Repeat | 1 |
| RotateCcw | 6 |
| Scale | 4 |
| Search | 16 |
| Send | 4 |
| Server | 3 |
| Share2 | 2 |
| Shield | 1 |
| ShieldAlert | 12 |
| ShieldCheck | 14 |
| ShieldX | 1 |
| ShoppingBag | 6 |
| Sliders | 1 |
| Smartphone | 1 |
| Square | 1 |
| Trash2 | 7 |
| Truck | 10 |
| Type | 1 |
| Upload | 2 |
| UploadCloud | 3 |
| User | 9 |
| UserCheck | 7 |
| UserPlus | 3 |
| UserX | 1 |
| Users | 3 |
| UsersRound | 2 |
| WifiOff | 4 |
| X | 10 |
| XCircle | 7 |
| Zap | 1 |

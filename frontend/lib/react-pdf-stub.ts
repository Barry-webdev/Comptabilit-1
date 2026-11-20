// Stub for @react-pdf/renderer in browser/Turbopack client build.
// The real library is only loaded at runtime via dynamic import with ssr:false.

export const Document = () => null;
export const Page = () => null;
export const Text = () => null;
export const View = () => null;
export const StyleSheet = { create: (s: Record<string, unknown>) => s };
export const PDFDownloadLink = () => null;
export const Font = { register: () => undefined };
export const Image = () => null;

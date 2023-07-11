import WebFontLoader from 'webfontloader';

export function getFontCssImportUrl(familyName: string) {
  return 'https://fonts.cdnfonts.com/css/' + familyName.toLowerCase().replace(/[^A-Za-z0-9]/g, '-');
}

export function useFont(familyName: string) {
  WebFontLoader.load({
    custom: {
      families: [familyName],
      urls: [getFontCssImportUrl(familyName)],
    },
  });
}

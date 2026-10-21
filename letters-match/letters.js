const LetterData = (() => {
  const cases = (bases) =>
    [...bases].flatMap((letter) => [letter, letter.toLowerCase()]);
  const ALL_LETTERS = [..."ABCDEFGHIJKLMNOPQRSTUVWXYZ"];
  const ALL_LOWERCASE = ALL_LETTERS.map((letter) => letter.toLowerCase());
  const ALL_PL_LETTERS = [..."AĄBCĆDEĘFGHIJKLŁMNŃOÓPRSŚTUWYZŹŻ"];
  const ALL_PL_LOWERCASE = ALL_PL_LETTERS.map((letter) => letter.toLowerCase());
  const LETTERS = Object.fromEntries(
    Object.entries({
      easy: "OUMWVYIL",
      medium: "EASGJP",
      hard: "CKFRNBDQ",
      fun: "ABCDEFGH",
      mixed: "HIJKLMNO",
      wild: "PQRSTUVWXYZ",
    }).map(([level, bases]) => [level, cases(bases)]),
  );
  // Every Polish letter appears in the numbered groups; Q, V and X never appear.
  const LETTERS_PL = Object.fromEntries(
    Object.entries({
      easy: "OUMWYIL",
      medium: "EASGJP",
      hard: "CKFRNBDĄĘŃÓ",
      fun: "ABCĆDEĘFG",
      mixed: "HIJKLŁMNŃOÓ",
      wild: "PRSŚTUWYZŹŻ",
    }).map(([level, bases]) => [level, cases(bases)]),
  );
  const LEVEL_PREVIEWS = {
    en: {
      easy: "Oo",
      medium: "Aa",
      hard: "Rr",
      fun: "Bb",
      mixed: "Mm",
      wild: "Zz",
    },
    pl: {
      easy: "Oo",
      medium: "Aa",
      hard: "Ąą",
      fun: "Ćć",
      mixed: "Łł",
      wild: "Żż",
    },
  };
  const LEVEL_ORDER = [
    "easy",
    "medium",
    "hard",
    "fun",
    "mixed",
    "wild",
    "infinite",
  ];
  const ROUNDS_PER_GAME = 10;
  return {
    ALL_LETTERS,
    ALL_LOWERCASE,
    ALL_PL_LETTERS,
    ALL_PL_LOWERCASE,
    LETTERS,
    LETTERS_PL,
    LEVEL_PREVIEWS,
    LEVEL_ORDER,
    ROUNDS_PER_GAME,
  };
})();
if (typeof module !== "undefined") module.exports = LetterData;

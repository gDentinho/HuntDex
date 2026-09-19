export const elementConfig: Record<string, { color: string }> = {
  Ghost: { color: "#a293ce" },
  Psychic: { color: "#cf8da7" },
  Fire: { color: "#d99872" },
  Grass: { color: "#8abb99" },
  Dark: { color: "#9c9aaa" },
  Neutral: { color: "#91a6b7" },
  Melee: { color: "#c4b297" },
};
export const elementColor = (element: string) =>
  elementConfig[element]?.color ?? "#82c8d5";

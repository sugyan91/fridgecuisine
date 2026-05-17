import dal from "@/assets/recipe-dal.jpg";
import saag from "@/assets/recipe-saag.jpg";
import rice from "@/assets/recipe-rice.jpg";
import paneer from "@/assets/recipe-paneer.jpg";
import momo from "@/assets/recipe-momo.jpg";
import chana from "@/assets/recipe-chana.jpg";

const library: Array<{ keywords: RegExp; src: string }> = [
  { keywords: /momo|dumpling/i, src: momo },
  { keywords: /dal|lentil|daal/i, src: dal },
  { keywords: /saag|spinach|palak|aloo|potato/i, src: saag },
  { keywords: /paneer|tofu|cheese/i, src: paneer },
  { keywords: /rice|biryani|pulao|jeera|fried rice/i, src: rice },
  { keywords: /chana|chickpea|garbanzo|masala/i, src: chana },
];

const fallbacks = [dal, saag, rice, paneer, momo, chana];

export function pickRecipeImage(title: string, index = 0): string {
  for (const { keywords, src } of library) {
    if (keywords.test(title)) return src;
  }
  return fallbacks[index % fallbacks.length];
}

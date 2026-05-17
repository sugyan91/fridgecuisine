## Goal

The "eg: {Food} from {Country}" line currently sits as a separate paragraph between the tagline and the input. Move it **inside** the dish input box (as the input's rotating placeholder / hint), and change the rotation interval to **30 seconds**.

## Changes (single file: `src/routes/index.tsx`)

1. Remove the standalone `<div>` block that renders the rotating world-food paragraph below the tagline.
2. Replace the input's current `placeholder` (which cycles `placeholderDishes` every 60s) with the world-food rotation, formatted as `eg: {Food} from {Country}` (e.g. `eg: Sushi from Japan`).
3. Change the world-food rotation interval from 3.5s → **30s**.
4. Remove the now-unused `placeholderDishes` array + `placeholderIndex` state + its interval to keep the file clean.

## Result

- Inside the white dish-to-recipe box, the input field itself shows a rotating placeholder like `eg: Sushi from Japan` → `eg: Ramen from Japan` → … cycling through ~500 dishes every 30 seconds.
- The standalone line outside/under the tagline is gone.
- Tagline rotation (the larger sentence above the input) is unchanged.

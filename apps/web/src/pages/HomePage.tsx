import { ClassicMenu } from "../features/home/ClassicMenu";
import "../features/home/home.css";

/**
 * The entry point (blueprint §20): the original's pause menu, with the four games as the party and
 * the sections as its commands (decision 0017).
 */
export function HomePage() {
  return <ClassicMenu />;
}

import { k } from "./kaplayContext";
import { registerTitleScene } from "./scenes/title";
import { registerWakeScene } from "./scenes/wake";
import { registerOverworldScene } from "./scenes/overworld";
import { registerEndingScene } from "./scenes/ending";

registerTitleScene();
registerWakeScene();
registerOverworldScene();
registerEndingScene();
k.go("title");

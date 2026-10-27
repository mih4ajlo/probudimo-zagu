import { loadAssets } from "./assets";
import { k } from "./kaplayContext";
import { registerTitleScene } from "./scenes/title";
import { registerWakeScene } from "./scenes/wake";
import { registerOverworldScene } from "./scenes/overworld";
import { registerEndingScene } from "./scenes/ending";

loadAssets();
registerTitleScene();
registerWakeScene();
registerOverworldScene();
registerEndingScene();
k.onLoad(() => k.go("title"));

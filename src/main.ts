import { loadAssets } from "./assets";
import { k } from "./kaplayContext";
import { registerTitleScene } from "./scenes/title";
import { registerWakeScene } from "./scenes/wake";
import { registerOverworldScene } from "./scenes/overworld";
import { registerEndingScene } from "./scenes/ending";
import { registerHuntScene } from "./scenes/hunt";
import { registerHuntEndingScene } from "./scenes/huntEnding";

loadAssets();
registerTitleScene();
registerWakeScene();
registerOverworldScene();
registerEndingScene();
registerHuntScene();
registerHuntEndingScene();
k.onLoad(() => k.go("title"));

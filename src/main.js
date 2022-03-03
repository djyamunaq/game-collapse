import * as COLLAPSE from './js/collapse.js';
import * as PIXI from 'pixi.js';

window.onload = function() {
    document.body.appendChild(app.view);
}

// Application reference
const app = new PIXI.Application({ height: 720, width: 800, antialias: true });
const gameSession = new COLLAPSE.GameSession(app);

gameSession.start();
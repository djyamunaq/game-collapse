import * as PIXI from 'pixi.js';
import { sound } from '@pixi/sound';

const FontFaceObserver = require('fontfaceobserver');

window.onload = function() {
    // Create a reference to use fonts used in game
    createFontReferences();
    // Add all container components of game to the main stage
    addContainersToStage();
    // Setup audio files for game
    setupAudio();
    // Initialize global parameters
    initializeParameters();
    // Add app view to page document
    document.body.appendChild(app.view);
    // Wait for loading fonts ant then start game
    font.load().then(setOpening);
    // Load sprites related to the tile objects
    loadTileSprites();
}

// Play scene parameters
const HEIGHT = 16;                                              // Height of playing scene in number of tiles
const WIDTH = 12;                                               // Width of playing scene in number of tiles
const N_LINES = 100;
// Game parameters
const l = 25;                                                   // Length of tile side/diameter of bomb
const GAP = 10;                                                 // Gap between tiles
const BOMB_RANGE = 3;                                           // Range of bomb in number of tiles
const x0 = 20;                                                  // Initial x-axis position for tiles
const y0 = 650;                                                 // Initial y-axis position for tiles
// Menu position parameters
const VOLUME_ICON_SIZE = 40;
const VOLUME_ICON_POS_Y = 80;
const GAME_OVER_TEXT_POS_Y = 150;
const PAUSE_BUTTON_POS_Y = 150;
const SCORE_LABEL_POS_Y = 260;
const SCORE_VALUE_POS_Y = 300;
const LEVEL_LABEL_POS_Y = 380;
const LEVEL_VALUE_POS_Y = 420;
const LINES_LEFT_LABEL_POS_Y = 500;
const LINES_LEFT_VALUE_POS_Y = 540;
const MENU_ITEMS_POS_X = 90;
const MENU_OFFSET = 20;                                         // Menu offset from play scene
const MIN_GROUP = 3;                                            // Min size of group of tiles to score
const MENU_x0 = WIDTH*(l + GAP) + MENU_OFFSET;                  // Start x position for menu 
// Time parameters
const TIME_LAPSE = 10;                                          // Time between frames
const OPENING_TIME_LAPSE = 1;                                   // Time between frames in opening
const TIME_LAPSE_PAUSE = 30;                                    // Time between frames in pause mode
const TIME_LAPSE_GRAVITY = 1;                                   // Time between gravity activities
// Main container parameters
const STAGE_WIDTH = 800;                                        // Width of play scenario
const STAGE_HEIGHT = 720;                                       // Height of play scenario
const STAGE_SIZE_X = Math.round(STAGE_WIDTH/(l + GAP));
const STAGE_SIZE_Y = Math.round(STAGE_HEIGHT/(l + GAP));
// Color HEX codes variables
const RED = 0xFF0000;                           
const GREEN = 0x00FF00;                         
const BLUE = 0x0000FF;    
const YELLOW = 0xf5d442;    
const ORANGE = 0Xff9d1c;                  
const WHITE = 0xFFFFFF;                         
const BLACK = 0x000000;                         

// Application reference
const app = new PIXI.Application({ height: STAGE_HEIGHT, width: STAGE_WIDTH, antialias: true });

// Pixi Containers references
const openingContainer = new PIXI.Container();
const playSceneContainer = new PIXI.Container();
const menuContainer = new PIXI.Container();
const playButtonContainer = new PIXI.Container();

// Graphics reference
const graphics = new PIXI.Graphics();   

// Tile sprite auxiliar variables
let grid;
let sprites;

// Load arcade style font
let font;

// Font Style Variables
let buttonTextStyle;
let gameOverTextStyle;
let labelTextStyle;
let valueTextStyle;
let playButtonTextStyle;

// Timers
let frameTimer;          
let gravityTimer;

// Count rendered sprites to create new line each 12 tiles
let counter;            
// Index for tile sprites pool                            
let index;

// Game variables
let level;
let score;
let linesLeft;
let paused;
let gameOver;
let onPlay;
let spritesRebuilt;
let victory;
let gameOverText;
let winText;

// Menu items
let scoreLabel;
let levelLabel;
let linesLeftLabel;
let scoreValue;
let levelValue;
let linesLeftValue;
let volumeOn;
let volumeOff;
let pauseButton;
let restartButton;

// Opening scene variables
let inOpening;
// While opening wall, keep track of y position of line being rendered
let yOpening;    
let playButtonText;
let openingBomb;

/* PLAY STATE IN LOOP */
function play() {

    // Main loop
    app.ticker.add((delta) => {
        frameTimer += delta;
    
        // Opening state
        if(inOpening) {
            if(frameTimer > OPENING_TIME_LAPSE) {
                frameTimer = 0;
                sound.play('beep');

                if(yOpening < 0) {
                    sound.stop('beep');

                    openingBomb.visible = true;
                }

                buildOpeningWall(yOpening);
    
                yOpening--;
            }
        } 
        // Game Over state
        else if(gameOver) {
            if(!spritesRebuilt) {
                spritesRebuilt = true;
                loadTileSprites();
            }
        } 
        // Playing mode -> not paused
        else if(!paused) {
            // Guarantee pause/resume oppacity is 100% if game not paused
            if(pauseButton != null) pauseButton.alpha = 1;   
            gravityTimer += delta;
    
            // Update scenario
            if(frameTimer > TIME_LAPSE) {
                frameTimer = 0;
    
                // Count number of tiles added to line
                if(counter == WIDTH+1) {
                    counter = 1;            
                    moveTilesUp();
                } 
                // If there are still tiles in pool, add to scene
                else if (index >= 0) {
                    addTile(counter, index);
                    index--;
                    counter++;
                } 
                // If there's no lines left to add and game detect no more matches, victory defined and play mode stops
                else if(linesLeft == 0 && isEndGame() && victory && onPlay) {
                    onPlay = false;

                    setWin();
                }
            }
            // Gravity and filling horizontal gaps
            if(gravityTimer > TIME_LAPSE_GRAVITY) {
                fillEmpty();
                gravityTimer = 0;
            }
        } 
        // Paused
        else if(frameTimer > TIME_LAPSE_PAUSE) {
            frameTimer = 0;
    
            // Change pause/resume oppacity btwn 0%/100%
            pauseButton.alpha = (pauseButton.alpha + 1) % 2;
        }
    });
    
}

/* SETUP PARAMETERS TO WIN STATE */
function setWin() {
    // Setup game over text
    let winStr = 'Win!\n' + score.toString() + ' Points'
    winText = new PIXI.Text(winStr, gameOverTextStyle);
    winText.x = 7*(l+ GAP) - gameOverText.width/2;
    winText.y = GAME_OVER_TEXT_POS_Y;
    app.stage.addChild(winText);

    pauseButton.visible = false;
    restartButton.visible = true;
    
    // Remove all tiles from last round
    playSceneContainer.removeChildren();
    // Reload sprites
    loadTileSprites();
}

/* PREPARE PLAY STATE SCENARIO */
function setPlayState() {
    onPlay = true;
    grid = zeros(HEIGHT+1, WIDTH);

    for(let i=2; i<20; i++) {
        for(let j=1; j<14; j++) {
            const x = j*(l+GAP);
            const y = i*(l+GAP);

            let globalPt = new PIXI.Point(x, y);
            let object = app.renderer.plugins.interaction.hitTest(globalPt);

            if(object != null) {
                object.visible = false;
            }
        }
    }

    for(let i=2; i<6; i++) {
        for(let j=15; j<20; j++) {
            const x = j*(l+GAP);
            const y = i*(l+GAP);

            let globalPt = new PIXI.Point(x, y);
            let object = app.renderer.plugins.interaction.hitTest(globalPt);

            if(object != null) {
                object.visible = false;
            }
        }
    }

    for(let i=7; i<10; i++) {
        for(let j=15; j<20; j++) {
            const x = j*(l+GAP);
            const y = i*(l+GAP);

            let globalPt = new PIXI.Point(x, y);
            let object = app.renderer.plugins.interaction.hitTest(globalPt);

            if(object != null) {
                object.visible = false;
            }
        }
    }

    for(let i=11; i<13; i++) {
        for(let j=15; j<20; j++) {
            const x = j*(l+GAP);
            const y = i*(l+GAP);

            let globalPt = new PIXI.Point(x, y);
            let object = app.renderer.plugins.interaction.hitTest(globalPt);

            if(object != null) {
                object.visible = false;
            }
        }
    }

    for(let i=14; i<17; i++) {
        for(let j=15; j<20; j++) {
            const x = j*(l+GAP);
            const y = i*(l+GAP);

            let globalPt = new PIXI.Point(x, y);
            let object = app.renderer.plugins.interaction.hitTest(globalPt);

            if(object != null) {
                object.visible = false;
            }
        }
    }
}

/* SET VARIABLES FOR OPENING ANIMATION AND PREPARE VARIABLES FOR PLAY MODE */
function setOpening() {
    // Setup font style for every text element in scene
    setupFontStyle();

    // Setup game over text
    gameOverText = new PIXI.Text('GAME\nOVER!', gameOverTextStyle);
    gameOverText.x = 7*(l+ GAP) - gameOverText.width/2;
    gameOverText.y = GAME_OVER_TEXT_POS_Y;
    gameOverText.visible = false;
    app.stage.addChild(gameOverText);

    // Load bomb sprite
    openingBomb = PIXI.Sprite.from('./assets/image/bomb.png');
    
    // Set size of bomb
    openingBomb.width = 16*l;
    openingBomb.height = 16*l;

    // Centralize bomb in stage
    openingBomb.x = STAGE_WIDTH/2 - openingBomb.width/2;
    openingBomb.y = STAGE_HEIGHT/2 - openingBomb.height/2;

    // openingBomb.visible = false;

    playButtonText = new PIXI.Text('Play', playButtonTextStyle);

    // Centralize play button text in bomb container
    playButtonText.x = openingBomb.width/2 - playButtonText.width/5;
    playButtonText.y = openingBomb.height/2 - playButtonText.height/16;
    
    playButtonText.buttonMode = true;
    playButtonText.interactive = true;

    // Hide bomb
    openingBomb.visible = false;

    // Add sprites to scene
    app.stage.addChild(openingBomb);
    openingBomb.addChild(playButtonText);
    
    // Set action for "Play" text in mouse down action
    playButtonText.on('mousedown', onClickPlayButton); // Change
    
    // Go into play mode
    play();
}

/* RESET VARIABLES TO INITIAL STATE */
function setRestart() {
    onPlay = true;
    gameOver = false;
    victory = false;

    linesLeft = N_LINES;
    linesLeftValue.text = linesLeft;
    score = 0;
    scoreValue.text = score;
    counter = 1;
    index = N_LINES*WIDTH - 1;
    gameOverText.visible = false;
    restartButton.visible = false;
    pauseButton.visible = true;

    if(winText != null) winText.visible = false;

    grid = zeros(HEIGHT+1, WIDTH);
}

/* SET VARIABLES TO GAME OVER STATE */
function setGameOver() {
    // Remove all tiles from last round
    playSceneContainer.removeChildren();

    // Set parameters to game over state
    spritesRebuilt = false;
    onPlay = false;
    restartButton.visible = true;
    pauseButton.visible = false;
    gameOver = true;
    gameOverText.visible = true;
    sound.play('game-over');
}

/* ACTION WHEN CLICKING PLAY INTERACTIVE TEXT */
function onClickPlayButton() {
    openingBomb.visible = false;
    inOpening = false;
    setPlayState();
    buildMenu();

    // Play background music in loop
    sound.play('background-music', {loop: true});
}

/* RENDERS OPENING WALL FOR INITIAL SCREEN */
function buildOpeningWall(y) {
    for(let i=0; i<STAGE_SIZE_X; i++) {
        graphics.lineStyle(2, WHITE, 1);
        graphics.beginFill(ORANGE, 1);
        graphics.drawRoundedRect(x0, y0, l, l, 1);
        graphics.endFill();

        // Create sprite from graphics object
        let texture = app.renderer.generateTexture(graphics);
        let tile = new PIXI.Sprite(texture);
        tile.interactive = true;
        tile.x = i*(l+GAP);
        tile.y = y*(l+GAP);
        // tile.alpha = 0.7;
        openingContainer.addChild(tile);
    }
    
}

/* SIMULATES GRAVITY AND FILLS HORIZONTAL GAPS IN PLAY CONTAINER WITH TILES */
function fillEmpty() {
    let filledY = true;
    playSceneContainer.children.forEach((child) => {
        const x = (child.x - x0)/(l+GAP) - 1;
        const y = HEIGHT - (y0 - child.y)/(l+GAP);

        if(y < HEIGHT-1 && grid[y][x] != 0 && grid[y+1][x] == 0) {
            filledY = false;
            grid[y+1][x] = grid[y][x];
            grid[y][x] = 0;
            child.y += (l + GAP);
        } 
        
    });
    if(filledY) {
        let parentX = playSceneContainer.x;
        let parentY = playSceneContainer.y;

        for(let j=0; j<WIDTH; j++) {
            for(let i=0; i<HEIGHT; i++) {
                if( (j < WIDTH/2 && grid[HEIGHT-1][j+1] != 0) || (j >= WIDTH/2 && grid[HEIGHT-1][j-1] != 0) ) continue;
                
                const globalX = x0 + (j + 1)*(l+GAP) + parentX;
                const globalY = y0 + (i - HEIGHT)*(l+GAP) + parentY;

                let globalPt = new PIXI.Point(globalX, globalY);
                let object = app.renderer.plugins.interaction.hitTest(globalPt, playSceneContainer);

                if(object != null && j < WIDTH/2 && grid[i][j+1] == 0) {
                    grid[i][j+1] = grid[i][j];
                    grid[i][j] = 0;

                    object.x += (l + GAP);
                } 
                else if(object != null && j >= WIDTH/2 && grid[i][j-1] == 0) {
                    grid[i][j-1] = grid[i][j];
                    grid[i][j] = 0;

                    object.x -= (l + GAP);
                }
            }
        }
    }

    // If all tiles have not fallen, no possible victory
    victory = filledY;
} 

/* PLAY EXPLOSION AUDIO AND DESTROY TILES AND BOMBS IN REACH ZONE */
function explodeBomb() {
    if(!onPlay) return;

    // Sound and particle effects
    sound.play('explosion');

    const x = (this.x - x0)/(l+GAP) - 1;
    const y = HEIGHT - (y0 - this.y)/(l+GAP);

    let leftLim  = x - BOMB_RANGE;
    let topLim   = y - BOMB_RANGE;
    let rightLim = x + BOMB_RANGE;
    let downLim  = y + BOMB_RANGE;

    if(leftLim < 0) leftLim = 0;
    if(topLim < 0) topLim = 0;
    if(rightLim > WIDTH - 1) rightLim = WIDTH - 1;
    if(downLim > HEIGHT -1) downLim = HEIGHT - 1;

    let parentX = playSceneContainer.x;
    let parentY = playSceneContainer.y;

    for(let j=leftLim; j<=rightLim; j++) {
        for(let i=topLim; i<=downLim; i++) {
            if(grid[i][j] != 0) {
                const globalX = x0 + (j + 1)*(l+GAP) + parentX;
                const globalY = y0 + (i - HEIGHT)*(l+GAP) + parentY;

                let globalPt = new PIXI.Point(globalX, globalY);
                let object = app.renderer.plugins.interaction.hitTest(globalPt, playSceneContainer);

                if(object != null) {
                    score++;
                    grid[i][j] = 0;
                    object.visible = false;
                    playSceneContainer.removeChild(object);
                }
            }
        }
    }
    playSceneContainer.removeChild(this);
}

/* DECREMENTS Y POSITION OF EVERY TILE AFTER LINE BUILT */
function moveTilesUp() {
    playSceneContainer.children.forEach((child) => {
        child.alpha = 1;
        
        const y = HEIGHT - (y0 - child.y)/(l+GAP);

        if(y == 0) {
            setGameOver();
            return;
        }

        child.y = child.y - l - GAP;

        // Make the tile interactive and set removeTiles function in mouse down interaction
        if(!child.interactive) {
            child.interactive = true;
            child.on('mousedown', removeTiles);
        }
    });
    
    for(let i=1; i<=HEIGHT; i++) {
        grid[i-1] = grid[i];
    }

    linesLeft--;
    linesLeftValue.text = linesLeft;

    grid[HEIGHT] = new Array(WIDTH).fill(0);

}

/* DESTROY TILES WHEN CLICKED IF IN GROUP OF 3 OR IF BOMB ACTIVATED AND TILE IN REACH ZONE */
function removeTiles() {    
    if(!onPlay) return;

    const x = (this.x - x0)/(l+GAP) - 1;
    const y = HEIGHT - (y0 - this.y)/(l+GAP);

    const color = grid[y][x];

    // Track visited tiles -> visited = 1, not visited = 0
    let visited = zeros(HEIGHT, WIDTH);

    let n = countTiles(color, x, y, visited);

    if(n >= MIN_GROUP) {
        sound.play('beep');

        score += n;
        scoreValue.text = score.toString();

        let parentX = playSceneContainer.x;
        let parentY = playSceneContainer.y;

        for(let j=0; j<WIDTH; j++) {
            for(let i=0; i<HEIGHT; i++) {
                if(visited[i][j]) {
                    const globalX = x0 + (j + 1)*(l+GAP) + parentX;
                    const globalY = y0 + (i - HEIGHT)*(l+GAP) + parentY;

                    let globalPt = new PIXI.Point(globalX, globalY);
                    let object = app.renderer.plugins.interaction.hitTest(globalPt, playSceneContainer);

                    if(object != null) {
                        grid[i][j] = 0;
                        playSceneContainer.removeChild(object);
                    }
                }
            }
        }
    }
}

/* WHEN CLICKING IN TILE, COUNT NEIGHBORS WITH SAME COLOR */
function countTiles(color, x, y, visited) {
    let n = 1;
    visited[y][x] = 1;

    if(y > 0 && !visited[y-1][x] && grid[y-1][x] == color) {
        n += countTiles(color, x, y-1, visited);
    }
    if(x < WIDTH-1 && !visited[y][x+1] && grid[y][x+1] == color) {
        n += countTiles(color, x+1, y, visited);
    }
    if(y < HEIGHT-1 && !visited[y+1][x] && grid[y+1][x] == color) {
        n += countTiles(color, x, y+1, visited);
    }
    if(x > 0 && !visited[y][x-1] && grid[y][x-1] == color) {
        n += countTiles(color, x-1, y, visited);
    }

    return n;
}

/* ADD A TILE TO PLAY SCENE FROM POOL OF SPRITES */
function addTile(offset, index) {
    let sprite = (sprites[index])[0];
    let code = (sprites[index])[1];
    
    if(code == -1) { // It's a bomb!
        sprite.interactive = true;
        sprite.on('mousedown', explodeBomb);    
    }

    sprite.alpha = 0.5;
    sprite.x = x0 + (l+GAP)*offset;
    sprite.y = y0;
    grid[HEIGHT][offset-1] = code;

    playSceneContainer.addChild(sprite);
}

/* CREATE TILES AND ADD TO POOL OF SPRITES */
function loadTileSprites() {
    sprites = {};
    let lim = N_LINES*WIDTH;

    for(let i=0; i<lim; i++) {
        // Returns a random integer from 1 to 3 to define color of tile
        let color = Math.round((Math.random() * 2)) + 1;    
        let colorHex = 0x0;

        switch(color) {
            case 1:
                colorHex = RED;
                break;
            case 2:
                colorHex = GREEN;
                break;
            case 3:
                colorHex = BLUE;
                break;   
        }

        // If bombTime == 1 -> create bomb
        let bombTime = Math.round((Math.random() * 100));
        graphics.clear();
        if(bombTime == 1) {
            // draw rounded rectangle sprites in R, G and B
            graphics.lineStyle(2, WHITE, 1);
            graphics.beginFill(BLACK, 1);
            graphics.drawCircle(x0, y0, l/2);
            graphics.endFill();

            // Create sprite from graphics object
            let texture = app.renderer.generateTexture(graphics);
            let bomb = new PIXI.Sprite(texture);
            bomb = PIXI.Sprite.from('./assets/image/bomb.png');
            bomb.width = l;
            bomb.height = l;
            // Add new sprite to pool of sprites
            sprites[i] = [bomb, -1];
        } else {
            // draw rounded rectangle sprites in R, G and B
            graphics.lineStyle(2, WHITE, 1);
            graphics.beginFill(colorHex, 1);
            graphics.drawRoundedRect(x0, y0, l, l, 1);
            graphics.endFill();

            // Create sprite from graphics object
            let texture = app.renderer.generateTexture(graphics);
            let tile = new PIXI.Sprite(texture);
            tile.interactive = false;

            // Add new sprite to pool of sprites
            sprites[i] = [tile, color];
        }
        
    }
    
}

/* Checks if there's still possible matches */
function isEndGame() {
    for(let i=HEIGHT-1; i>=0; i--) {
        for(let j=0; j<WIDTH; j++) {
            let color = grid[i][j];

            if(color == 0) continue;
            
            let visited = zeros(HEIGHT, WIDTH);

            let n = countTiles(color, j, i, visited);

            if(n >= 3) return false;
        }
    }
    return true;
}

/* CHANGE STATE OF VOLUME (MUTE/UNMUTE) */
function setVolume() {
    if(volumeOn.visible) {
        volumeOn.visible = false;
        volumeOff.visible = true;
        sound.muteAll()
    } else {
        volumeOn.visible = true;
        volumeOff.visible = false;
        sound.unmuteAll()
    }
}

/* SETUP MENU ELEMENTS AND ADD TO MENU CONTAINER */
function buildMenu() {
    pauseButton = new PIXI.Text('Pause', buttonTextStyle);
    pauseButton.buttonMode = true;
    pauseButton.interactive = true;
    pauseButton.on('mousedown', setPause);

    restartButton = new PIXI.Text('Restart', buttonTextStyle);
    restartButton.buttonMode = true;
    restartButton.interactive = true;
    restartButton.on('mousedown', setRestart);
    restartButton.visible = false;

    scoreLabel = new PIXI.Text('Score', labelTextStyle);
    scoreValue = new PIXI.Text(score.toString(), valueTextStyle);

    levelLabel = new PIXI.Text('Level', labelTextStyle);
    levelValue = new PIXI.Text(level.toString(), valueTextStyle);
    
    linesLeftLabel = new PIXI.Text('Lines Left', labelTextStyle);
    linesLeftValue = new PIXI.Text(linesLeft.toString(), valueTextStyle);

    pauseButton.x = MENU_ITEMS_POS_X;
    pauseButton.y = PAUSE_BUTTON_POS_Y;
    
    restartButton.x = MENU_ITEMS_POS_X;
    restartButton.y = PAUSE_BUTTON_POS_Y;

    scoreLabel.x = MENU_ITEMS_POS_X;
    scoreLabel.y = SCORE_LABEL_POS_Y;
    scoreValue.x = MENU_ITEMS_POS_X;
    scoreValue.y = SCORE_VALUE_POS_Y;
    
    levelLabel.x = MENU_ITEMS_POS_X;
    levelLabel.y = LEVEL_LABEL_POS_Y;
    levelValue.x = MENU_ITEMS_POS_X;
    levelValue.y = LEVEL_VALUE_POS_Y;

    linesLeftLabel.x = MENU_ITEMS_POS_X;
    linesLeftLabel.y = LINES_LEFT_LABEL_POS_Y;
    linesLeftValue.x = MENU_ITEMS_POS_X;
    linesLeftValue.y = LINES_LEFT_VALUE_POS_Y;

    volumeOn = PIXI.Sprite.from('./assets/image/volume-on.png');
    volumeOff = PIXI.Sprite.from('./assets/image/volume-off.png');

    volumeOff.visible = false;

    volumeOn.x = MENU_ITEMS_POS_X;
    volumeOn.y = VOLUME_ICON_POS_Y;
    volumeOff.x = MENU_ITEMS_POS_X;
    volumeOff.y = VOLUME_ICON_POS_Y;

    volumeOn.height = VOLUME_ICON_SIZE;
    volumeOn.width = VOLUME_ICON_SIZE;
    volumeOff.height = VOLUME_ICON_SIZE;
    volumeOff.width = VOLUME_ICON_SIZE;

    volumeOn.interactive = true;
    volumeOff.interactive = true;

    volumeOn.on('mousedown', setVolume);
    volumeOff.on('mousedown', setVolume);

    menuContainer.addChild(pauseButton);
    menuContainer.addChild(restartButton);
    menuContainer.addChild(scoreLabel);
    menuContainer.addChild(scoreValue);
    menuContainer.addChild(levelLabel);
    menuContainer.addChild(levelValue);
    menuContainer.addChild(linesLeftLabel);
    menuContainer.addChild(linesLeftValue);
    menuContainer.addChild(volumeOn);
    menuContainer.addChild(volumeOff); 
}

/* PAUSE IN PLAY MODE (ALL GAME MECHANICS STOP, MUSIC CONTINUES) */
function setPause() {
    if(!paused) {
        onPlay = false;
        this.text = "Resume";
        paused = true;
    } else {
        onPlay = true;
        this.text = "Pause";
        paused = false;
    }
}

/* CREATE MxN MATRIX FILLED WITH ZEROS */
function zeros(m, n) {
    return [...Array(m)].map(e => Array(n).fill(0));
} 

/* SETUP FONT STYLES USED IN GAME ELEMENTS WITH TEXTS */
function setupFontStyle() {
    buttonTextStyle = new PIXI.TextStyle({
        fontFamily: 'Minecraft',
        fontSize: 36,
        fill: '#ffffff'
    });
    gameOverTextStyle = new PIXI.TextStyle({
        fontFamily: 'Minecraft',
        fontSize: 72,
        fill: '#ffffff'
    });
    labelTextStyle = new PIXI.TextStyle({
        fontFamily: 'Minecraft',
        fontSize: 30,
        fill: '#ffffff'
    });
    valueTextStyle = new PIXI.TextStyle({
        fontFamily: 'Minecraft',
        fontSize: 24,
        fill: '#ffffff'
    });
    playButtonTextStyle = new PIXI.TextStyle({
        fontFamily: 'Minecraft',
        fontSize: 84,
        fill: '#ffffff'
    });
}

/* SETUP AUDIO ASSETS USED IN GAME */
function setupAudio() {
    sound.add('background-music', './assets/audio/Loyalty-Freak-Music-Hyper-Jingle-Bells.mp3');
    sound.add('beep', './assets/audio/mixkit-retro-game-notification-212.wav');
    sound.add('game-over', './assets/audio/mixkit-arcade-retro-game-over-213.wav');
    sound.add('explosion', './assets/audio/mixkit-8-bit-bomb-explosion-2811.wav');
}

/* SETUP REFERENCE TO LOAD FONTS TO BE USED IN COMPONENTS */
function createFontReferences() {
    font = new FontFaceObserver('Minecraft');
}

/* ADD ALL CONTAINERS USED IN APP TO THE APP STAGE */
function addContainersToStage() {
    app.stage.addChild(openingContainer);
    
    app.stage.addChild(playSceneContainer);
    
    app.stage.addChild(menuContainer);
    menuContainer.x = MENU_x0;

    app.stage.addChild(playButtonContainer);
}

/* INITIALIZE GLOBAL PARAMETERS FOR GAME */
function initializeParameters() {
    // Game variables
    level = 1;
    score = 0;
    linesLeft = N_LINES;
    paused = false;
    gameOver = false;
    onPlay = false;
    victory = false;

    // Tile sprite counter
    counter = 1;       
    // Sprite pool index                        
    index = N_LINES*WIDTH - 1;

    // Opening state variables
    yOpening = STAGE_SIZE_Y - 1; 
    inOpening = true;

    // Reset timers
    frameTimer = 0;
    gravityTimer = 0;
}


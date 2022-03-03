import { sound, SoundSprite } from '@pixi/sound';
import * as PIXI from 'pixi.js';
import { Ticker } from 'pixi.js';

const FontFaceObserver = require('fontfaceobserver');

class GameSession {

    constructor(app) {
        // Pixi Application reference
        this.app = app;
        // Load font for game texts
        this.textFont = new FontFaceObserver('Minecraft');
    }

    start() {
        // Load fonts for game texts and then run opening
        this.textFont.load().then(() => {
            this.sessionBuild();
            this.openingTicker.start();
            this.runOpening();
        });
    }

    play() {
        // Main loop
        this.playTicker.add((delta) => {

            this.frameTimer += delta;
            this.gravityTimer += delta;
            
            // Game Over
            if(this.onGameOver) {
                this.setGameOver();
            }
            // Playing mode
            else if(this.onPlay && !this.sessionPaused) {
                // Guarantee pause/resume oppacity is 100% if game not paused
                if(this.pauseButton != null) this.pauseButton.alpha = 1;   
        
                // Update scenario
                if(this.frameTimer > this.TIME_LAPSE) {
                    this.frameTimer = 0;
        
                    if(this.linesLeft > 0) {
                        // Count number of tiles added to line
                        if(this.newLineCounter == this.WIDTH+1) {
                            this.newLineCounter = 1;            
                            this.moveLinesUp();
                        } else {
                            this.addGameElement(this.newLineCounter++);
                        } 
                    } else if(this.noMoreMatches()) {
                        this.win();
                    }
                    
                }
                // Gravity and filling horizontal gaps
                if(this.gravityTimer > this.TIME_LAPSE_GRAVITY) {
                    this.fillEmpty();
                }
            } 
            // Paused
            else if(this.onPause && this.frameTimer > this.TIME_LAPSE_PAUSE) {
                this.frameTimer = 0;
                
                // Change pause/resume oppacity btwn 0%/100%
                this.pauseButton.alpha = (this.pauseButton.alpha + 1) % 2;
            }
        });
    }

    pauseResume() {
        if(!this.sessionPaused) {
            this.sessionPaused = true;
            this.onPlay = false;
            
            sound.muteAll();
            this.volumeOn.interactive = false;
            this.volumeOff.interactive = false;

            this.pauseButton.text = "Resume";
        } else {
            this.sessionPaused = false;
            this.onPlay = true;

            sound.unmuteAll();
            this.volumeOn.interactive = true;
            this.volumeOff.interactive = true;

            this.pauseButton.text = "Pause";
        } 
    }

    mute() {
        if(!this.muted) {
            this.muted = true;
            this.volumeOn.visible = false;
            this.volumeOff.visible = true;
            sound.muteAll()
        } 
    }

    unmute() {
        if (this.muted) {
            this.muted = false;
            this.volumeOn.visible = true;
            this.volumeOff.visible = false;
            sound.unmuteAll()
        }
    }

    win() {
        this.onPlay = false;

        // Setup game over text
        let winStr = 'Win!\n' + this.score.toString() + ' Points'
        this.winText = new PIXI.Text(winStr, this.gameOverTextStyle);
        this.winText.x = 7*(this.L + this.GAP) - this.gameOverText.width/2;
        this.winText.y = this.GAME_OVER_TEXT_POS_Y;
        
        this.app.stage.addChild(this.winText);

        this.pauseButton.visible = false;
        this.restartButton.visible = true;
    }

    noMoreMatches() {
        for(let i=this.HEIGHT-1; i>=0; i--) {
            for(let j=0; j<this.WIDTH; j++) {
                let color = this.auxGrid[i][j];
    
                if(color == 0) continue;
                
                let visited = [...Array(this.HEIGHT)].map(e => Array(this.WIDTH).fill(0));
    
                let n = this.countGroup(color, j, i, visited);
    
                if(n >= 3) return false;
            }
        }
        return true;
    }

    setPlayView() {
        const K = this.L + this.GAP;

        for(let i=2; i<20; i++) {
            for(let j=1; j<14; j++) {
                const x = j*K;
                const y = i*K;

                let globalPt = new PIXI.Point(x, y);
                let object = this.app.renderer.plugins.interaction.hitTest(globalPt);

                if(object != null) {
                    object.visible = false;
                }
            }
        }

        for(let i=2; i<6; i++) {
            for(let j=15; j<20; j++) {
                const x = j*K;
                const y = i*K;

                let globalPt = new PIXI.Point(x, y);
                let object = this.app.renderer.plugins.interaction.hitTest(globalPt);

                if(object != null) {
                    object.visible = false;
                }
            }
        }

        for(let i=7; i<10; i++) {
            for(let j=15; j<20; j++) {
                const x = j*K;
                const y = i*K;

                let globalPt = new PIXI.Point(x, y);
                let object = this.app.renderer.plugins.interaction.hitTest(globalPt);

                if(object != null) {
                    object.visible = false;
                }
            }
        }

        for(let i=11; i<13; i++) {
            for(let j=15; j<20; j++) {
                const x = j*K;
                const y = i*K;

                let globalPt = new PIXI.Point(x, y);
                let object = this.app.renderer.plugins.interaction.hitTest(globalPt);

                if(object != null) {
                    object.visible = false;
                }
            }
        }

        for(let i=14; i<17; i++) {
            for(let j=15; j<20; j++) {
                const x = j*K;
                const y = i*K;

                let globalPt = new PIXI.Point(x, y);
                let object = this.app.renderer.plugins.interaction.hitTest(globalPt);

                if(object != null) {
                    object.visible = false;
                }
            }
        }
    }

    runOpening() {
        this.openingTicker.add((delta) => {this.openingLoop(delta)});
    }

    openingLoop(delta) {
        this.frameTimer += delta;

        if(this.frameTimer > 1) {
            if(this.yOpening < 0) {
                this.setOpeningScreen();
                this.openingTicker.stop();
            }
            this.frameTimer = 0;
            this.buildOpeningWall(this.yOpening--);
        }
    }

    setOpeningScreen() {
        this.playButtonContainer.addChild(this.playButtonText);
        this.playButtonContainer.width = this.playButtonText.width;
        this.playButtonContainer.height = this.playButtonText.height;
        this.playButtonText.x = (this.playButtonContainer.width - this.playButtonText.width)/2;
        this.playButtonText.y = (this.playButtonContainer.height - this.playButtonText.height)/2; 

        this.playButtonContainer.interactive = true;
        this.playButtonContainer.buttonMode = true;

        this.playButtonContainer.on('mousedown', () => {
            this.openingBomb.visible = false;
            this.openingBomb.visible = false;
            this.setPlayView();
            this.buildMenu();

            // Play background music in loop
            sound.play('background-music', {loop: true});

            this.onPlay = true;
            this.playTicker.start();
            this.play();
        });

        this.openingBomb.addChild(this.playButtonContainer);
        this.playButtonContainer.x = (this.openingBomb.width - this.playButtonContainer.width)/2;
        this.playButtonContainer.y = (this.openingBomb.height - this.playButtonContainer.height)/2; 

        this.app.stage.addChild(this.openingBomb);
        this.openingBomb.x = (this.app.stage.width - this.openingBomb.width)/2;
        this.openingBomb.y = (this.app.stage.height - this.openingBomb.height)/2; 
    }

    buildOpeningWall(y) {
        this.graphics.clear();

        for(let i=0; i<this.STAGE_SIZE_X; i++) {
            this.graphics.lineStyle(2, this.WHITE, 1);
            this.graphics.beginFill(this.ORANGE, 1);
            this.graphics.drawRoundedRect(this.X0, this.Y0, this.L, this.L, 1);
            this.graphics.endFill();
    
            let texture = this.app.renderer.generateTexture(this.graphics);
            let tile = new PIXI.Sprite(texture);
            tile.interactive = true; 

            const K = this.L+this.GAP;

            tile.x = i*(K);
            tile.y = y*(K);

            this.openingContainer.addChild(tile);
        }
        
    }

    setGameOver() {
        sound.play('game-over');

        const K = this.L + this.GAP;

        // Set parameters to game over state
        this.onPlay = false;
        this.restartButton.visible = true;
        this.pauseButton.visible = false;
        this.gameOverText.visible = true;

        this.gameOverText.x = 7*K - this.gameOverText.width/2;
        this.gameOverText.y = this.GAME_OVER_TEXT_POS_Y;

        this.app.stage.addChild(this.gameOverText);
    }

    setRestart() {
        // Clear data from last session and create new one
        this.playSceneContainer.removeChildren();
        this.gameElementManager.reset();

        // Reset parameters for next session
        this.onPlay = true;
        this.onPause = false;
        this.onGameOver = false;
        this.victory = false;
    
        this.linesLeft = this.N_LINES;
        this.linesLeftValue.text = this.linesLeft;
        this.score = 0;
        this.scoreValue.text = this.score;
        this.newLineCounter = 1;
        this.gameOverText.visible = false;
        this.restartButton.visible = false;
        this.pauseButton.visible = true;
    
        if(this.winText != null) this.winText.visible = false;
        
        this.auxGrid = [...Array(this.HEIGHT+1)].map(e => Array(this.WIDTH).fill(0));
        this.spriteGrid = [...Array(this.HEIGHT+1)].map(e => Array(this.WIDTH).fill(null));
    }

    buildMenu() {
        this.pauseButton = new PIXI.Text('Pause', this.buttonTextStyle);
        this.pauseButton.buttonMode = true;
        this.pauseButton.interactive = true;

        this.pauseButton.on('mousedown', this.pauseResume.bind(this));
    
        this.restartButton = new PIXI.Text('Restart', this.buttonTextStyle);
        this.restartButton.buttonMode = true;
        this.restartButton.interactive = true;
        this.restartButton.on('mousedown', this.setRestart.bind(this));
        this.restartButton.visible = false;
    
        this.scoreLabel = new PIXI.Text('Score', this.labelTextStyle);
        this.scoreValue = new PIXI.Text(this.score.toString(), this.valueTextStyle);
    
        this.levelLabel = new PIXI.Text('Level', this.labelTextStyle);
        this.levelValue = new PIXI.Text(this.level.toString(), this.valueTextStyle);
        
        this.linesLeftLabel = new PIXI.Text('Lines Left', this.labelTextStyle);
        this.linesLeftValue = new PIXI.Text(this.linesLeft.toString(), this.valueTextStyle);
    
        this.pauseButton.x = this.MENU_ITEMS_POS_X;
        this.pauseButton.y = this.PAUSE_BUTTON_POS_Y;
        
        this.restartButton.x = this.MENU_ITEMS_POS_X;
        this.restartButton.y = this.PAUSE_BUTTON_POS_Y;
    
        this.scoreLabel.x = this.MENU_ITEMS_POS_X;
        this.scoreLabel.y = this.SCORE_LABEL_POS_Y;
        this.scoreValue.x = this.MENU_ITEMS_POS_X;
        this.scoreValue.y = this.SCORE_VALUE_POS_Y;
        
        this.levelLabel.x = this.MENU_ITEMS_POS_X;
        this.levelLabel.y = this.LEVEL_LABEL_POS_Y;
        this.levelValue.x = this.MENU_ITEMS_POS_X;
        this.levelValue.y = this.LEVEL_VALUE_POS_Y;
    
        this.linesLeftLabel.x = this.MENU_ITEMS_POS_X;
        this.linesLeftLabel.y = this.LINES_LEFT_LABEL_POS_Y;
        this.linesLeftValue.x = this.MENU_ITEMS_POS_X;
        this.linesLeftValue.y = this.LINES_LEFT_VALUE_POS_Y;
    
        this.volumeOff.visible = false;
    
        this.volumeOn.x = this.MENU_ITEMS_POS_X;
        this.volumeOn.y = this.VOLUME_ICON_POS_Y;
        this.volumeOff.x = this.MENU_ITEMS_POS_X;
        this.volumeOff.y = this.VOLUME_ICON_POS_Y;
    
        this.volumeOn.height = this.VOLUME_ICON_SIZE;
        this.volumeOn.width = this.VOLUME_ICON_SIZE;
        this.volumeOff.height = this.VOLUME_ICON_SIZE;
        this.volumeOff.width = this.VOLUME_ICON_SIZE;
    
        this.volumeOn.interactive = true;
        this.volumeOff.interactive = true;
    
        this.volumeOn.on('mousedown', this.mute.bind(this));
        this.volumeOff.on('mousedown', this.unmute.bind(this));
    
        this.menuContainer.addChild(this.pauseButton);
        this.menuContainer.addChild(this.restartButton);
        this.menuContainer.addChild(this.scoreLabel);
        this.menuContainer.addChild(this.scoreValue);
        this.menuContainer.addChild(this.levelLabel);
        this.menuContainer.addChild(this.levelValue);
        this.menuContainer.addChild(this.linesLeftLabel);
        this.menuContainer.addChild(this.linesLeftValue);
        this.menuContainer.addChild(this.volumeOn);
        this.menuContainer.addChild(this.volumeOff); 
    }

    loadPoolOfSprites() {
        let lim = this.N_LINES*this.WIDTH;

        for(let i=0; i<lim; i++) {
            // Returns a random integer from 1 to 3 to define color of tile
            let color = Math.round((Math.random() * 2)) + 1;    
            let colorHex = 0x0;

            switch(color) {
                case 1:
                    colorHex = this.RED;
                    break;
                case 2:
                    colorHex = this.GREEN;
                    break;
                case 3:
                    colorHex = this.BLUE;
                    break;   
            }

            // If bombTime == 1 -> create bomb
            let bombTime = Math.round((Math.random() * 300));

            if(bombTime == 1) {
                let bombSprite = PIXI.Sprite.from('./assets/image/bomb.png');
                this.gameElementManager.createBomb(this.L/2, bombSprite);
            } else {
                this.gameElementManager.createTile(colorHex, this.L);
            }
        }
    }

    moveLinesUp() {
        for(let i=0; i<=this.HEIGHT; i++) {
            for(let j=0; j<this.WIDTH; j++) {
                let sprite = this.spriteGrid[i][j];
                
                if(sprite != null) {
                    if(i == 0) {
                        this.onGameOver = true;
                        return;
                    }
                    if(!sprite.interactive) {
                        sprite.interactive = true;
                        sprite.on('mousedown', this.removeGroup.bind(this));
                    }

                    sprite.alpha = 1;
                    sprite.y -= (this.L + this.GAP);
                }
            }

            this.auxGrid[i-1] = this.auxGrid[i];
            this.spriteGrid[i-1] = this.spriteGrid[i];
        }
    
        this.linesLeft--;
        this.linesLeftValue.text = this.linesLeft;
    
        this.auxGrid[this.HEIGHT] = new Array(this.WIDTH).fill(0);
        this.spriteGrid[this.HEIGHT] = new Array(this.WIDTH).fill(null);

    }

    addGameElement(offset) {
        const x = this.X0 + (this.L+this.GAP)*offset;
        const y = this.Y0;

        // Return game element in format [sprite, code]
        let gameElement = this.gameElementManager.getGameElement();

        if(gameElement != null) {
            let sprite = gameElement[0];
            let code = gameElement[1];
            
            sprite.interactive = false;

            // It's a bomb!
            if(code == -1) { 
                sprite.interactive = true;
                sprite.on('mousedown', this.explodeBomb.bind(this));   
            }

            sprite.alpha = 0.5;
            sprite.x = x;
            sprite.y = y;
            
            this.auxGrid[this.HEIGHT][offset-1] = code;
            this.spriteGrid[this.HEIGHT][offset-1] = sprite;

            this.playSceneContainer.addChild(sprite);
        }
        
    }

    countGroup(color, x, y, visited) {
        let n = 1;
        visited[y][x] = 1;

        if(y > 0 && !visited[y-1][x] && this.auxGrid[y-1][x] == color) {
            n += this.countGroup(color, x, y-1, visited);
        }
        if(x < this.WIDTH-1 && !visited[y][x+1] && this.auxGrid[y][x+1] == color) {
            n += this.countGroup(color, x+1, y, visited);
        }
        if(y < this.HEIGHT-1 && !visited[y+1][x] && this.auxGrid[y+1][x] == color) {
            n += this.countGroup(color, x, y+1, visited);
        }
        if(x > 0 && !visited[y][x-1] && this.auxGrid[y][x-1] == color) {
            n += this.countGroup(color, x-1, y, visited);
        }

        return n;
    }

    removeGroup(event) {
        if(!this.onPlay) return;

        const K = this.L + this.GAP;
    
        let targetX = event.data.global.x;
        let targetY = event.data.global.y;
        
        let x = Math.floor((targetX- this.X0)/K - 1);
        let y = Math.floor(this.HEIGHT - (this.Y0 - targetY)/K);

        let color = this.auxGrid[y][x];
    
        let visited = [...Array(this.HEIGHT)].map(e => Array(this.WIDTH).fill(0));
    
        let n = this.countGroup(color, x, y, visited);
        console.log(n);

        if(n >= this.MIN_GROUP) {
            sound.play('beep');
    
            // Update score
            this.score += n;
            this.scoreValue.text = this.score.toString();
    
            for(let j=0; j<this.WIDTH; j++) {
                for(let i=0; i<this.HEIGHT; i++) {
                    if(visited[i][j]) {
                        let sprite = this.spriteGrid[i][j];

                        if(sprite != null) {
                            this.auxGrid[i][j] = 0;
                            this.spriteGrid[i][j] = null;
                            this.playSceneContainer.removeChild(sprite);
                        }
                    }
                }
            }
        }
    }  

    explodeBomb(event) {
        if(!this.onPlay) return;

        sound.play('explosion');

        const K = this.L + this.GAP;
    
        let targetX = event.data.global.x;
        let targetY = event.data.global.y;
        
        let x = Math.floor((targetX- this.X0)/K - 1);
        let y = Math.floor(this.HEIGHT - (this.Y0 - targetY)/K);

        if(y >= this.HEIGHT) return;

        let leftLim  = x - this.BOMB_RANGE;
        let topLim   = y - this.BOMB_RANGE;
        let rightLim = x + this.BOMB_RANGE;
        let downLim  = y + this.BOMB_RANGE;

        if(leftLim < 0) leftLim = 0;
        if(topLim < 0) topLim = 0;
        if(rightLim > this.WIDTH - 1) rightLim = this.WIDTH - 1;
        if(downLim > this.HEIGHT -1) downLim = this.HEIGHT - 1;

        for(let j=leftLim; j<=rightLim; j++) {
            for(let i=topLim; i<=downLim; i++) {
                if(this.auxGrid[i][j] != 0) {
                    let sprite = this.spriteGrid[i][j];
                    let code = this.auxGrid[i][j];

                    if(sprite != null) {
                        if(code > 0) {
                            this.score++;
                            this.scoreValue.text = this.score.toString();
                        }
                        
                        this.auxGrid[i][j] = 0;
                        this.spriteGrid[i][j] = null;
                        this.playSceneContainer.removeChild(sprite);
                    }
                }
            }
        }
    }

    fillEmpty() {
        let filledY = true;
        const K = this.L + this.GAP;
        
        // Fill y-axis gaps
        for(let i=this.HEIGHT-2; i>=0; i--) {
            for(let j=0; j<this.WIDTH; j++) {
                if(this.auxGrid[i][j] != 0 && this.auxGrid[i+1][j] == 0) {
                    filledY = false;
                    
                    let sprite = this.spriteGrid[i][j];
                    sprite.y += K;

                    this.auxGrid[i+1][j] = this.auxGrid[i][j];
                    this.auxGrid[i][j] = 0;

                    this.spriteGrid[i+1][j] = this.spriteGrid[i][j];
                    this.spriteGrid[i][j] = null;
                }
            }
        }
            
        // Fill x-axis gaps
        if(filledY) {
            for(let j=0; j<this.WIDTH; j++) {
                for(let i=0; i<this.HEIGHT; i++) {
                    if(j < this.WIDTH/2 && this.auxGrid[this.HEIGHT-1][j+1] != 0) continue;
                    if(j >= this.WIDTH/2 && this.auxGrid[this.HEIGHT-1][j-1] != 0) continue;
                    if(this.spriteGrid[i][j] == null) continue;

                    if(j < this.WIDTH/2 && this.auxGrid[i][j+1] == 0) {
                        let sprite = this.spriteGrid[i][j];
                        sprite.x += K;

                        this.auxGrid[i][j+1] = this.auxGrid[i][j];
                        this.auxGrid[i][j] = 0;

                        this.spriteGrid[i][j+1] = this.spriteGrid[i][j];
                        this.spriteGrid[i][j] = null;
                    } 
                    else if(j >= this.WIDTH/2 && this.auxGrid[i][j-1] == 0) {
                        let sprite = this.spriteGrid[i][j];
                        sprite.x -= K;

                        this.auxGrid[i][j-1] = this.auxGrid[i][j];
                        this.auxGrid[i][j] = 0;

                        this.spriteGrid[i][j-1] = this.spriteGrid[i][j];
                        this.spriteGrid[i][j] = null;
                    }
                }
            }
        }
    
        // If all tiles have not fallen, no possible victory
        // this.victory = filledY;
    } 

    sessionBuild() {
        this.graphics = new PIXI.Graphics();   
        this.gameElementManager = new GameElementManager(this.graphics, this.app.renderer);
        this.playTicker = new PIXI.Ticker();
        this.openingTicker = new PIXI.Ticker();

        this.setupConstants();
        this.initializeSessionParameters();
        this.setupContainers();
        this.setupColors();
        this.setupImages();
        this.setupFontStyles();
        this.setupTexts();
        this.setupAudio();
        this.loadPoolOfSprites();
    }

    initializeSessionParameters() {
        // Game variables
        this.level = 1;
        this.score = 0;
        this.linesLeft = this.N_LINES;
        this.sessionPaused = false;
        this.onGameOver = false;
        this.onPlay = false;
        this.onVictory = false;
        this.muted = false;
        this.auxGrid = [...Array(this.HEIGHT+1)].map(e => Array(this.WIDTH).fill(0));
        this.spriteGrid = [...Array(this.HEIGHT+1)].map(e => Array(this.WIDTH).fill(null));

        // Tile sprite counter
        this.newLineCounter = 1;       

        // Opening state variables
        this.yOpening = this.STAGE_SIZE_Y - 1; 
        this.inOpening = true;

        // Reset timers
        this.frameTimer = 0;
        this.gravityTimer = 0;
    }

    setupContainers() {
        // Pixi Containers References for Session
        this.openingContainer = new PIXI.Container();
        this.playSceneContainer = new PIXI.Container();
        this.menuContainer = new PIXI.Container();
        this.playButtonContainer = new PIXI.Container();

        // Align menu container in x-axis
        this.menuContainer.x = this.MENU_X0;

        // Add containers to app stage
        this.app.stage.addChild(this.openingContainer);
        this.app.stage.addChild(this.playSceneContainer);
        this.app.stage.addChild(this.menuContainer);
        this.app.stage.addChild(this.playButtonContainer);
    }

    setupConstants() {
        // Play scene parameters
        this.HEIGHT = 16;                                                                   // Height of playing scene in number of tiles
        this.WIDTH = 12;                                                                    // Width of playing scene in number of tiles
        this.N_LINES = 100;
        // Game parameters
        this.L = 25;                                                                        // Length of tile side/diameter of bomb
        this.GAP = 10;                                                                      // Gap between tiles
        this.BOMB_RANGE = 3;                                                                // Range of bomb in number of tiles
        this.X0 = 20;                                                                       // Initial x-axis position for tiles
        this.Y0 = 650;                                                                      // Initial y-axis position for tiles
        // Menu position parameters
        this.VOLUME_ICON_SIZE = 40;
        this.VOLUME_ICON_POS_Y = 80;
        this.GAME_OVER_TEXT_POS_Y = 150;
        this.PAUSE_BUTTON_POS_Y = 150;
        this.SCORE_LABEL_POS_Y = 260;
        this.SCORE_VALUE_POS_Y = 300;
        this.LEVEL_LABEL_POS_Y = 380;
        this.LEVEL_VALUE_POS_Y = 420;
        this.LINES_LEFT_LABEL_POS_Y = 500;
        this.LINES_LEFT_VALUE_POS_Y = 540;
        this.MENU_ITEMS_POS_X = 90;
        this.MENU_OFFSET = 20;                                                              // Menu offset from play scene
        this.MIN_GROUP = 3;                                                                 // Min size of group of tiles to score
        this.MENU_X0 = this.WIDTH*(this.L + this.GAP) + this.MENU_OFFSET;                  // Start x position for menu 
        // Time parameters
        this.TIME_LAPSE = 10;                                                               // Time between frames
        this.OPENING_TIME_LAPSE = 1;                                                        // Time between frames in opening
        this.TIME_LAPSE_PAUSE = 30;                                                         // Time between frames in pause mode
        this.TIME_LAPSE_GRAVITY = 2;                                                        // Time between gravity activities
        // Main container parameters
        this.STAGE_WIDTH = 800;                                                             // Width of play scenario
        this.STAGE_HEIGHT = 720;                                                            // Height of play scenario
        this.STAGE_SIZE_X = Math.round(this.STAGE_WIDTH/(this.L + this.GAP));
        this.STAGE_SIZE_Y = Math.round(this.STAGE_HEIGHT/(this.L + this.GAP));
    }

    setupColors() {
        // Color HEX codes variables
        this.RED = 0xFF0000;                           
        this.GREEN = 0x00FF00;                         
        this.BLUE = 0x0000FF;    
        this.YELLOW = 0xf5d442;    
        this.ORANGE = 0Xff9d1c;                  
        this.WHITE = 0xFFFFFF;                         
        this.BLACK = 0x000000;
    }

    setupFontStyles() {
        this.buttonTextStyle = new PIXI.TextStyle({
            fontFamily: 'Minecraft',
            fontSize: 36,
            fill: '#ffffff'
        });
        this.gameOverTextStyle = new PIXI.TextStyle({
            fontFamily: 'Minecraft',
            fontSize: 72,
            fill: '#ffffff'
        });
        this.labelTextStyle = new PIXI.TextStyle({
            fontFamily: 'Minecraft',
            fontSize: 30,
            fill: '#ffffff'
        });
        this.valueTextStyle = new PIXI.TextStyle({
            fontFamily: 'Minecraft',
            fontSize: 24,
            fill: '#ffffff'
        });
        this.playButtonTextStyle = new PIXI.TextStyle({
            fontFamily: 'Minecraft',
            fontSize: 84,
            fill: '#ffffff'
        });
    }

    setupTexts() {
        this.pauseButton = new PIXI.Text('Pause', this.buttonTextStyle);
        this.playButtonText = new PIXI.Text('Play', this.playButtonTextStyle);
        this.gameOverText = new PIXI.Text('GAME\nOVER!', this.gameOverTextStyle);
        this.restartButton = new PIXI.Text('Restart', this.buttonTextStyle);
        this.scoreLabel = new PIXI.Text('Score', this.labelTextStyle);
        this.scoreValue = new PIXI.Text(this.score.toString(), this.valueTextStyle);
        this.levelLabel = new PIXI.Text('Level', this.labelTextStyle);
        this.linesLeftLabel = new PIXI.Text('Lines Left', this.labelTextStyle);
    }

    setupImages() {
        this.volumeOn = PIXI.Sprite.from('./assets/image/volume-on.png');
        this.volumeOff = PIXI.Sprite.from('./assets/image/volume-off.png');
        this.openingBomb = PIXI.Sprite.from('./assets/image/bomb.png');
        this.volumeOn = PIXI.Sprite.from('./assets/image/volume-on.png');
        this.volumeOff = PIXI.Sprite.from('./assets/image/volume-off.png');
    }

    setupAudio() {
        sound.add('background-music', './assets/audio/Loyalty-Freak-Music-Hyper-Jingle-Bells.mp3');
        sound.add('beep', './assets/audio/mixkit-retro-game-notification-212.wav');
        sound.add('game-over', './assets/audio/mixkit-arcade-retro-game-over-213.wav');
        sound.add('explosion', './assets/audio/mixkit-8-bit-bomb-explosion-2811.wav');
    }
    
}

/* CREATE AND STORE ELEMENTS RENDERED FOR PLAYING INTERACTION */
class GameElementManager {
    
    constructor(graphics, renderer) {
        this.graphics = graphics;
        this.renderer = renderer;
        this.poolOfSprites = {};
        this.internalCounter = 0;
        this.poolSize = 0;
        this.indexArr = [];
    }

    createTile(color, size) {
        let WHITE = 0xFFFFFF;

        this.graphics.clear();

        // draw rounded rectangle sprites in R, G and B
        this.graphics.lineStyle(2, WHITE, 1);
        this.graphics.beginFill(color, 1);
        this.graphics.drawRoundedRect(0, 0, size, size, 1);
        this.graphics.endFill();

        // Create sprite from graphics object
        let texture = this.renderer.generateTexture(this.graphics);
        let gameElement = new PIXI.Sprite(texture);
        gameElement.interactive = false;

        // Add new sprite to pool of sprites
        this.poolOfSprites[this.poolSize] = [gameElement, color];
        this.indexArr.push(this.poolSize++);
    }

    createBomb(radius, sprite) {
        sprite.width = 2*radius;
        sprite.height = 2*radius;

        // Add new sprite to pool of sprites
        this.poolOfSprites[this.poolSize] = [sprite, -1];
        this.indexArr.push(this.poolSize++);
    }

    getGameElement() {
        return this.poolOfSprites[this.indexArr[this.internalCounter++]];
    }

    reset() {
        this.internalCounter = 0;
        this.poolSize = 0;
        this.shuffleIndexArray();
    }

    shuffleIndexArray() {
        let array = this.indexArr;
        let currentIndex = array.length, randomIndex;
      
        // While there remain elements to shuffle...
        while (currentIndex != 0) {
          // Pick a remaining element...
          randomIndex = Math.floor(Math.random() * currentIndex);
          currentIndex--;
      
          // And swap it with the current element.
          [array[currentIndex], array[randomIndex]] = [
            array[randomIndex], array[currentIndex]];
        }
      
        return array;
      }
}


export {GameSession}
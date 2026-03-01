/**
 * ============================================================
 *  PlatformerGame — Mini-jeu Mario-like avec Phaser 3
 *  100% statique, GitHub Pages ready
 *  Version : 1.0
 * ============================================================
 *
 *  Fichiers attendus :
 *    /index.html
 *    /main.js
 *    /assets/player.png  ← VOTRE image
 *    /assets/coin.png
 *    /assets/tiles.png
 *    /assets/enemy.png
 *    /assets/flag.png
 *
 *  Contrôles :
 *    ← →    : courir
 *    ESPACE : sauter
 *    R      : restart
 * ============================================================
 */

/* ──────────────────────────────────────────
   0.  CONSTANTES GLOBALES
────────────────────────────────────────── */
const GAME_W       = 480;
const GAME_H       = 270;
const WORLD_W      = 6400;
const GRAVITY      = 600;
const PLAYER_SPEED = 160;
const JUMP_VEL     = -380;
const ENEMY_SPEED  = 60;
const STOMP_BOUNCE = -220;

const PALETTE = {
  tile    : 0x8b6914,
  tileEdge: 0xa87c1e,
  coin    : 0xffd700,
  enemy   : 0xe74c3c,
  flag    : 0x2ecc71,
  flagPole: 0x95a5a6,
};

/* ──────────────────────────────────────────
   1.  CONFIGURATION PHASER
────────────────────────────────────────── */
const config = {
  type: Phaser.AUTO,
  width : GAME_W,
  height: GAME_H,
  backgroundColor: '#87ceeb',
  parent: 'game-container',

  scale: {
    mode      : Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width     : GAME_W,
    height    : GAME_H,
  },

  physics: {
    default: 'arcade',
    arcade : { gravity: { y: GRAVITY }, debug: false },
  },

  scene: [BootScene, GameScene, UIScene, GameOverScene, WinScene],
};

const game = new Phaser.Game(config);

/* ══════════════════════════════════════════════════════════════
   SCÈNE 1 : BOOT
══════════════════════════════════════════════════════════════ */
class BootScene extends Phaser.Scene {
  constructor() { super({ key: 'BootScene' }); }

  preload() {
    // Génère les textures de fallback AVANT le chargement
    this._generateFallbackTextures();

    // Intercepte les erreurs de chargement (fichier absent → fallback)
    this.load.on('loaderror', (file) => {
      console.warn(`[Boot] Asset manquant : ${file.key} → fallback utilisé.`);
    });

    this.load.image('player', 'assets/player.png');
    this.load.image('tile',   'assets/tiles.png');
    this.load.image('coin',   'assets/coin.png');
    this.load.image('enemy',  'assets/enemy.png');
    this.load.image('flag',   'assets/flag.png');
  }

  create() {
    this.scene.start('GameScene');
    this.scene.launch('UIScene');
  }

  _generateFallbackTextures() {
    const t = this.textures;

    // --- Tuile brique ---
    if (!t.exists('tile')) {
      const g = this.make.graphics({ x:0, y:0, add:false });
      g.fillStyle(PALETTE.tile);
      g.fillRect(0, 0, 32, 32);
      g.fillStyle(PALETTE.tileEdge);
      g.fillRect(0, 0, 32, 4);
      g.lineStyle(1, 0x6b4f0e, 1);
      g.strokeRect(0, 0, 32, 32);
      g.strokeRect(0, 0, 16, 16);
      g.strokeRect(16, 16, 16, 16);
      g.generateTexture('tile', 32, 32);
      g.destroy();
    }

    // --- Pièce d'or ---
    if (!t.exists('coin')) {
      const g = this.make.graphics({ x:0, y:0, add:false });
      g.fillStyle(PALETTE.coin);
      g.fillCircle(8, 8, 8);
      g.fillStyle(0xffe066);
      g.fillCircle(6, 6, 4);
      g.generateTexture('coin', 16, 16);
      g.destroy();
    }

    // --- Ennemi rouge ---
    if (!t.exists('enemy')) {
      const g = this.make.graphics({ x:0, y:0, add:false });
      g.fillStyle(PALETTE.enemy);
      g.fillRoundedRect(0, 0, 28, 28, 4);
      g.fillStyle(0xffffff);
      g.fillCircle(8, 10, 4);
      g.fillCircle(20, 10, 4);
      g.fillStyle(0x000000);
      g.fillCircle(9, 10, 2);
      g.fillCircle(21, 10, 2);
      g.lineStyle(2, 0x000000);
      g.strokePoints([{x:6,y:20},{x:14,y:24},{x:22,y:20}]);
      g.generateTexture('enemy', 28, 28);
      g.destroy();
    }

    // --- Drapeau fin de niveau ---
    if (!t.exists('flag')) {
      const g = this.make.graphics({ x:0, y:0, add:false });
      g.fillStyle(PALETTE.flagPole);
      g.fillRect(12, 0, 4, 64);
      g.fillStyle(PALETTE.flag);
      g.fillTriangle(16, 4, 16, 28, 40, 16);
      g.fillStyle(0x7f8c8d);
      g.fillRect(4, 60, 24, 8);
      g.generateTexture('flag', 44, 70);
      g.destroy();
    }

    // --- Joueur de substitution ---
    if (!t.exists('player')) {
      const g = this.make.graphics({ x:0, y:0, add:false });
      g.fillStyle(0x3498db);
      g.fillRoundedRect(4, 16, 24, 20, 4);
      g.fillStyle(0xffe0b2);
      g.fillCircle(16, 12, 11);
      g.fillStyle(0xe74c3c);
      g.fillRect(5, 4, 22, 8);
      g.fillRect(3, 8, 3, 5);
      g.fillStyle(0x000000);
      g.fillCircle(12, 12, 2);
      g.fillCircle(20, 12, 2);
      g.lineStyle(2, 0x5d4037);
      g.strokePoints([{x:9,y:16},{x:16,y:14},{x:23,y:16}]);
      g.generateTexture('player', 32, 36);
      g.destroy();
    }
  }
}

/* ══════════════════════════════════════════════════════════════
   SCÈNE 2 : GAME — Logique principale
══════════════════════════════════════════════════════════════ */
class GameScene extends Phaser.Scene {
  constructor() { super({ key: 'GameScene' }); }

  create() {
    this.registry.set('score', 0);
    this.registry.set('gameOver', false);

    this._createBackground();
    this._buildLevel();
    this._createPlayer();
    this._createEnemies();
    this._createCoins();
    this._createFlag();
    this._setupCollisions();

    // Caméra qui suit le joueur
    this.cameras.main.setBounds(0, 0, WORLD_W, GAME_H);
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);

    // Contrôles
    this.cursors  = this.input.keyboard.createCursorKeys();
    this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.rKey     = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R);

    this._jumpPressed = false;
  }

  // ── Fond dégradé + nuages parallaxe ──
  _createBackground() {
    const rt = this.add.renderTexture(0, 0, GAME_W, GAME_H);
    const g  = this.make.graphics({ add: false });
    for (let i = 0; i < GAME_H; i++) {
      const t  = i / GAME_H;
      const r  = Phaser.Math.Linear(0x87, 0xd4, t);
      const gr = Phaser.Math.Linear(0xce, 0xf1, t);
      const b  = Phaser.Math.Linear(0xeb, 0xf9, t);
      g.fillStyle(Phaser.Display.Color.GetColor(r, gr, b));
      g.fillRect(0, i, GAME_W, 1);
    }
    rt.draw(g);
    g.destroy();
    rt.setScrollFactor(0);

    // Nuages décoratifs (parallaxe lente)
    const clouds = [
      [120,40,60,22],[300,25,80,28],[600,50,50,18],[900,30,70,24],
      [1300,45,55,20],[1800,20,90,30],[2400,38,65,22],[3200,28,75,25],
      [4100,42,55,19],[5200,35,68,23],
    ];
    const cl = this.add.graphics();
    cl.fillStyle(0xffffff, 0.85);
    clouds.forEach(([x,y,w,h]) => cl.fillEllipse(x, y, w, h));
    cl.setScrollFactor(0.15);
  }

  // ── Construction du niveau ──
  _buildLevel() {
    this.platforms = this.physics.add.staticGroup();
    const groundY  = GAME_H - 32;

    // Trous dans le sol
    const gaps = [
      {from:800,  to:864 },{from:1600, to:1696},
      {from:2400, to:2496},{from:3200, to:3296},
      {from:4000, to:4096},{from:5000, to:5096},
    ];

    for (let x = 0; x < WORLD_W; x += 32) {
      if (!gaps.some(g => x >= g.from && x < g.to)) {
        this.platforms.create(x + 16, groundY + 16, 'tile').refreshBody();
      }
    }

    // Plateformes flottantes [x_centre, y_centre, nb_tuiles]
    const fp = [
      [200,190,5],[450,160,4],[680,140,3],
      [950,170,5],[1150,140,4],[1400,160,6],
      [1700,180,4],[1900,150,5],[2100,120,3],
      [2600,170,4],[2800,140,5],[3000,160,4],
      [3400,175,5],[3600,145,4],[3900,130,6],
      [4200,180,5],[4400,155,4],[4600,130,3],[4900,115,5],
      [5200,170,4],[5500,140,5],[5800,160,4],[6000,180,6],
    ];

    fp.forEach(([cx, cy, tiles]) => {
      const half = (tiles * 32) / 2;
      for (let i = 0; i < tiles; i++) {
        this.platforms.create(cx - half + i * 32 + 16, cy, 'tile').refreshBody();
      }
    });
  }

  // ── Joueur ──
  _createPlayer() {
    this.player = this.physics.add.sprite(64, GAME_H - 80, 'player');
    this.player.setCollideWorldBounds(false);
    this.player.setMaxVelocity(400, 800);
    this.player.body.setSize(
      Math.min(this.player.width,  28),
      Math.min(this.player.height, 32),
      true
    );
    this.player.setDepth(10);
  }

  // ── Ennemis (patrouille) ──
  _createEnemies() {
    this.enemies = this.physics.add.group({ allowGravity: true });

    const data = [
      [250, GAME_H-60, 150, 350],[500, GAME_H-60, 400, 600],
      [1000,GAME_H-60, 900,1100],[1500,GAME_H-60,1350,1600],
      [2000,GAME_H-60,1850,2200],[2700,GAME_H-60,2550,2900],
      [3100,GAME_H-60,2900,3300],[3700,GAME_H-60,3500,3900],
      [4300,GAME_H-60,4100,4500],[4800,GAME_H-60,4600,5000],
      [5400,GAME_H-60,5200,5600],[5900,GAME_H-60,5700,6100],
      // sur plateformes
      [450,135,370,520],[1150,115,1070,1230],
      [3600,120,3520,3680],[4900,90,4820,4980],
    ];

    data.forEach(([x, y, left, right]) => {
      const e = this.enemies.create(x, y, 'enemy');
      e.setMaxVelocity(200, 800);
      e.patrolLeft  = left;
      e.patrolRight = right;
      e.setVelocityX(ENEMY_SPEED);
      e.direction = 1;
      e.setDepth(9);
      e.body.setSize(22, 24, true);
    });
  }

  // ── Pièces collectibles ──
  _createCoins() {
    this.coins = this.physics.add.staticGroup();

    const line = (sx, y, n, sp) =>
      Array.from({length: n}, (_, i) => [sx + i * sp, y]);

    const positions = [
      ...line(100, GAME_H-60,5,40),...line(700, GAME_H-60,3,40),
      ...line(1100,GAME_H-60,4,40),...line(1700,GAME_H-60,5,40),
      ...line(2200,GAME_H-60,3,40),...line(2900,GAME_H-60,4,40),
      ...line(3500,GAME_H-60,5,40),...line(4100,GAME_H-60,4,40),
      ...line(4700,GAME_H-60,3,40),...line(5300,GAME_H-60,5,40),
      ...line(5900,GAME_H-60,4,40),
      // sur plateformes
      [200,165],[240,165],[280,165],
      [450,135],[482,135],[514,135],
      [950,145],[982,145],
      [1400,135],[1432,135],[1464,135],
      [1700,155],[1732,155],
      [2600,145],[2632,145],
      [3400,150],[3432,150],[3464,150],
      [3900,105],[3932,105],[3964,105],
      [4900,90],[4932,90],[4964,90],
      [5500,115],[5532,115],[5564,115],
    ];

    positions.forEach(([cx,cy]) =>
      this.coins.create(cx, cy, 'coin').refreshBody()
    );
  }

  // ── Drapeau fin de niveau ──
  _createFlag() {
    this.flag = this.physics.add.staticSprite(WORLD_W - 200, GAME_H - 100, 'flag');
    this.flag.body.setSize(32, 64, true);
    this.flag.refreshBody();
    this.flag.setDepth(8);
  }

  // ── Collisions & overlaps ──
  _setupCollisions() {
    this.physics.add.collider(this.player,  this.platforms);
    this.physics.add.collider(this.enemies, this.platforms);
    this.physics.add.overlap(this.player, this.coins,   this._collectCoin,        null, this);
    this.physics.add.overlap(this.player, this.enemies, this._handleEnemyContact, null, this);
    this.physics.add.overlap(this.player, this.flag,    this._reachFlag,          null, this);
  }

  // ── Collecte une pièce (+1 pt) ──
  _collectCoin(player, coin) {
    coin.destroy();
    this.registry.set('score', this.registry.get('score') + 1);
    this._popText(coin.x, coin.y, '+1', '#ffd700');
  }

  // ── Contact joueur/ennemi ──
  _handleEnemyContact(player, enemy) {
    if (this.registry.get('gameOver')) return;
    const fallingDown = player.body.velocity.y > 0;
    const stomp       = fallingDown && player.body.bottom <= enemy.body.top + 12;

    if (stomp) {
      // Stomp → ennemi éliminé, rebond, +5 pts
      enemy.destroy();
      player.setVelocityY(STOMP_BOUNCE);
      this.registry.set('score', this.registry.get('score') + 5);
      this._popText(enemy.x, enemy.y, '+5 💀', '#ff6b6b');
    } else {
      // Contact latéral → Game Over
      this._triggerGameOver();
    }
  }

  // ── Drapeau atteint → victoire ──
  _reachFlag() {
    if (this.registry.get('gameOver')) return;
    this.registry.set('gameOver', true);
    this.scene.stop('UIScene');
    this.scene.start('WinScene');
  }

  // ── Game Over ──
  _triggerGameOver() {
    if (this.registry.get('gameOver')) return;
    this.registry.set('gameOver', true);
    this.cameras.main.flash(300, 255, 50, 50);
    this.time.delayedCall(400, () => {
      this.scene.stop('UIScene');
      this.scene.start('GameOverScene');
    });
  }

  // ── Texte flottant +score ──
  _popText(x, y, msg, color = '#fff') {
    const txt = this.add.text(x, y, msg, {
      fontSize: '12px', color,
      fontStyle: 'bold', stroke: '#000', strokeThickness: 3,
    }).setDepth(20).setOrigin(0.5);
    this.tweens.add({
      targets: txt, y: y - 30, alpha: 0,
      duration: 700, ease: 'Power2',
      onComplete: () => txt.destroy(),
    });
  }

  // ── Boucle de mise à jour (60 fps) ──
  update() {
    if (this.registry.get('gameOver')) return;

    const { left, right, up } = this.cursors;
    const p = this.player;

    // Restart
    if (Phaser.Input.Keyboard.JustDown(this.rKey)) {
      this.registry.set('score', 0);
      this.registry.set('gameOver', false);
      this.scene.restart();
      this.scene.stop('UIScene');
      this.scene.launch('UIScene');
      return;
    }

    // Mort par chute
    if (p.y > GAME_H + 60) { this._triggerGameOver(); return; }

    // Déplacement horizontal
    if (left.isDown) {
      p.setVelocityX(-PLAYER_SPEED);
      p.setFlipX(true);
    } else if (right.isDown) {
      p.setVelocityX(PLAYER_SPEED);
      p.setFlipX(false);
    } else {
      p.setVelocityX(p.body.velocity.x * 0.75); // friction
    }

    // Saut (anti double-saut)
    const jumpDown = up.isDown || this.spaceKey.isDown;
    if (jumpDown && !this._jumpPressed && p.body.blocked.down) {
      p.setVelocityY(JUMP_VEL);
      this._jumpPressed = true;
      this.tweens.add({
        targets: p, scaleY: 0.85, scaleX: 1.15,
        duration: 80, yoyo: true,
      });
    }
    if (!jumpDown) this._jumpPressed = false;

    // IA ennemis : patrouille gauche/droite
    this.enemies.getChildren().forEach((e) => {
      if (!e.active) return;
      if (e.x >= e.patrolRight) { e.setVelocityX(-ENEMY_SPEED); e.setFlipX(true);  }
      else if (e.x <= e.patrolLeft) { e.setVelocityX(ENEMY_SPEED); e.setFlipX(false); }
      // légère oscillation verticale
      e.y += Math.sin(this.time.now * 0.003 + e.x * 0.01) * 0.3;
    });

    // Tilt joueur selon vitesse
    p.setAngle(Phaser.Math.Clamp(p.body.velocity.x * 0.04, -8, 8));
  }
}

/* ══════════════════════════════════════════════════════════════
   SCÈNE 3 : UI — HUD score (superposé, toujours visible)
══════════════════════════════════════════════════════════════ */
class UIScene extends Phaser.Scene {
  constructor() { super({ key: 'UIScene' }); }

  create() {
    this.add.rectangle(0, 0, GAME_W, 22, 0x000000, 0.45).setOrigin(0);

    this.scoreTxt = this.add.text(10, 4, '🪙  0', {
      fontSize: '12px', color: '#ffd700', fontStyle: 'bold',
    });

    this.add.text(GAME_W - 6, 4, '← → ESPACE  |  R Restart', {
      fontSize: '9px', color: '#ffffff99',
    }).setOrigin(1, 0);

    this.registry.events.on('changedata-score', (_, val) => {
      this.scoreTxt.setText(`🪙  ${val}`);
    });
  }
}

/* ══════════════════════════════════════════════════════════════
   SCÈNE 4 : GAME OVER
══════════════════════════════════════════════════════════════ */
class GameOverScene extends Phaser.Scene {
  constructor() { super({ key: 'GameOverScene' }); }

  create() {
    const cx = GAME_W / 2, cy = GAME_H / 2;
    this.add.rectangle(cx, cy, GAME_W, GAME_H, 0x1a0000, 0.88);

    this.add.text(cx, cy - 50, '💀  GAME OVER', {
      fontSize: '28px', color: '#ff4444', fontStyle: 'bold',
      stroke: '#000', strokeThickness: 4,
    }).setOrigin(0.5);

    const score = this.registry.get('score');
    this.add.text(cx, cy - 12,
      `Score final : ${score} pièce${score > 1 ? 's' : ''}`,
      { fontSize: '14px', color: '#ffcccc' }
    ).setOrigin(0.5);

    this._makeButton(cx, cy + 30, '▶  Rejouer', () => this._restart());
    this.input.keyboard.once('keydown-R', () => this._restart());
  }

  _restart() {
    this.registry.set('score', 0);
    this.registry.set('gameOver', false);
    this.scene.stop('GameOverScene');
    this.scene.stop('UIScene');
    this.scene.start('GameScene');
    this.scene.launch('UIScene');
  }

  _makeButton(x, y, label, cb) {
    const bg = this.add.rectangle(x, y, 140, 32, 0xff4444).setInteractive({ useHandCursor: true });
    const tx = this.add.text(x, y, label, { fontSize:'13px', color:'#fff', fontStyle:'bold' }).setOrigin(0.5);
    bg.on('pointerover',  () => bg.setFillStyle(0xff6666));
    bg.on('pointerout',   () => bg.setFillStyle(0xff4444));
    bg.on('pointerdown',  () => { bg.setScale(0.95); tx.setScale(0.95); });
    bg.on('pointerup',    cb);
  }
}

/* ══════════════════════════════════════════════════════════════
   SCÈNE 5 : WIN — Victoire + confettis
══════════════════════════════════════════════════════════════ */
class WinScene extends Phaser.Scene {
  constructor() { super({ key: 'WinScene' }); }

  create() {
    const cx = GAME_W / 2, cy = GAME_H / 2;
    this.add.rectangle(cx, cy, GAME_W, GAME_H, 0x001a00, 0.88);
    this._spawnConfetti();

    this.add.text(cx, cy - 55, '🏆  YOU WIN!', {
      fontSize: '30px', color: '#ffd700', fontStyle: 'bold',
      stroke: '#000', strokeThickness: 4,
    }).setOrigin(0.5);

    const score = this.registry.get('score');
    this.add.text(cx, cy - 15, `Score : ${score} pièce${score > 1 ? 's' : ''}`,
      { fontSize: '15px', color: '#aaffaa' }
    ).setOrigin(0.5);

    this.add.text(cx, cy + 8, 'Bravo ! Tu as atteint la fin du niveau.',
      { fontSize: '10px', color: '#ccffcc' }
    ).setOrigin(0.5);

    this._makeButton(cx, cy + 38, '▶  Rejouer', () => this._restart());
    this.input.keyboard.once('keydown-R', () => this._restart());
  }

  _restart() {
    this.registry.set('score', 0);
    this.registry.set('gameOver', false);
    this.scene.stop('WinScene');
    this.scene.stop('UIScene');
    this.scene.start('GameScene');
    this.scene.launch('UIScene');
  }

  _spawnConfetti() {
    const colors = [0xffd700,0xff6b6b,0x74b9ff,0x00cec9,0xa29bfe,0xfd79a8];
    for (let i = 0; i < 60; i++) {
      const g = this.add.rectangle(
        Phaser.Math.Between(0, GAME_W),
        Phaser.Math.Between(-10, GAME_H * 0.4),
        Phaser.Math.Between(3, 7), Phaser.Math.Between(3, 7),
        Phaser.Utils.Array.GetRandom(colors)
      );
      this.tweens.add({
        targets: g,
        y: GAME_H + 20,
        x: g.x + Phaser.Math.Between(-40, 40),
        angle: Phaser.Math.Between(0, 360),
        duration: Phaser.Math.Between(1200, 2800),
        delay: Phaser.Math.Between(0, 800),
        repeat: -1, ease: 'Linear',
      });
    }
  }

  _makeButton(x, y, label, cb) {
    const bg = this.add.rectangle(x, y, 140, 32, 0x00b894).setInteractive({ useHandCursor: true });
    const tx = this.add.text(x, y, label, { fontSize:'13px', color:'#fff', fontStyle:'bold' }).setOrigin(0.5);
    bg.on('pointerover',  () => bg.setFillStyle(0x00d2a0));
    bg.on('pointerout',   () => bg.setFillStyle(0x00b894));
    bg.on('pointerdown',  () => { bg.setScale(0.95); tx.setScale(0.95); });
    bg.on('pointerup',    cb);
  }
}

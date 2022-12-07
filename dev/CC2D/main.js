
/*



*/

// @helper
// MISC & HELPER FUNCTIONS

const TOOL_ANY = 0;
const TOOL_PICKAXE = 1;
const TOOL_AXE = 2;
const TOOL_SHOVEL = 3;

const TIER_ANY = 0;
const TIER_WOOD = 1;
const TIER_STONE = 2;
const TIER_IRON = 3;
const TIER_DIAMOND = 4;

const ITEMCAT_ITEM = 0;
const ITEMCAT_BLOCK = 1;
const ITEMCAT_TOOL = 2;

function randomRange(lo, hi) {
  let rand = Math.random();
  let range = hi-lo;
  return lo + (range*rand);
}
function randomRangeInt(lo, hi) {
  let rand = Math.random();
  let range = hi-lo+1;
  return Math.floor(lo + (range*rand));
}
function floatString(n) {
  if (n%1 == 0) {
    return String(n) + ".0";
  } else {
    return String(n);
  }
}

// @assets
// ASSET MANAGER
// it basically just maps ID strings to objects

let assets = {
  loadedFonts: 0,
  numFonts:0,
  mapFonts: new Map(),
  addFont: function(id, url) {
    this.mapFonts.set(id, new FontFace(id, `url(${url})`));
    this.numFonts++;
    this.mapFonts.get(id).load().then(function(font) {
      document.fonts.add(font);
      assets.loadedFonts++;
    });
  },

  loadedTextures: 0,
  numTextures: 0,
  mapTextures: new Map(),
  addTexture: function(id, path, width, height, columns) {
    this.mapTextures.set(id, new Texture(path, width, height, columns));
    this.numTextures++;
    this.mapTextures.get(id).img.onload = function() {
      assets.loadedTextures++;
    };
  },
  texture: function(id) {
    return this.mapTextures.get(id);
  },

  mapBlocks: new Map(),
  addBlock: function(id, texture, textureIndex, properties) {
    this.mapBlocks.set(id, new Block(id, texture, textureIndex, properties));
  },
  block: function(id) {
    return this.mapBlocks.get(id);
  },

  mapSpecies: new Map(),
  addSpecies: function(id, properties) {
    this.mapSpecies.set(id, new Species(properties));
  },
  species: function(id) {
    return this.mapSpecies.get(id);
  },

  mapItemTypes: new Map(),
  addItemType: function(id, texture, textureIndex, properties) {
    this.mapItemTypes.set(id, new ItemType(id, texture, textureIndex, properties));
  },
  itemType: function(id) {
    return this.mapItemTypes.get(id);
  }

};

// @fonts
// FONTS

assets.addFont("MCRegular", "assets/font/MCRegular.otf");

// @textures
// TEXTURES

class Texture {
  constructor(path, width, height, columns) {
    this.width = width;
    this.height = height;
    this.columns = columns;
    this.img = document.createElement("img");
    this.img.src = path;
  }
}

assets.addTexture("tooltip_cap", "assets/gui/tooltip_cap.png", 6, 15, 2);
assets.addTexture("tooltip_mid", "assets/gui/tooltip_mid.png", 1, 15, 1);
assets.addTexture("cursor", "assets/gui/cursor.png", 8, 8, 1);
assets.addTexture("cursor_no", "assets/gui/cursor_no.png", 15, 15, 1);
assets.addTexture("hotbar_cursor", "assets/gui/hotbar_cursor.png", 26, 26, 1);
assets.addTexture("hotbar","assets/gui/hotbar.png", 214, 34, 1);
assets.addTexture("inventory","assets/gui/inventory.png", 214, 120, 1);
assets.addTexture("inventory_with_crafting","assets/gui/inventory_with_crafting.png", 302, 120, 1);
assets.addTexture("crafting_table","assets/gui/crafting_table.png", 116, 84, 1);

assets.addTexture("blocks_natural","assets/blocks/natural.png", 16, 16, 16);
assets.addTexture("blocks_natural_w","assets/blocks/natural_w.png", 16, 16, 16);
assets.addTexture("blocks_wood","assets/blocks/wood.png", 16, 16, 16);
assets.addTexture("blocks_wood_w","assets/blocks/wood_w.png", 16, 16, 16);
assets.addTexture("cracks","assets/blocks/cracks.png", 16, 16, 10);

assets.addTexture("tools","assets/items/tools.png", 16, 16, 16);
assets.addTexture("items1","assets/items/items1.png", 16, 16, 16);

assets.addTexture("steve_arms","assets/steve_arms.png", 16, 20, 8);
assets.addTexture("steve_legs","assets/steve_legs.png", 16, 12, 6);
assets.addTexture("pig","assets/mob_pig.png", 32, 16, 6);


// @blocks
// BLOCKS

class Block {
  constructor(id, texture, textureIndex, properties) {
    let p = properties ?? {};
    this.id = id;
    this.name = p.name;
    this.texture = assets.texture(texture);
    this.texture_w = assets.texture(texture+"_w");
    this.textureIndex = textureIndex;

    this.fullyOpaque = p.fullyOpaque ?? true;
    this.solid = p.solid ?? true;
    this.wallable = p.wallable ?? true;
    this.variants = p.variants ?? 1;

    this.properTool = p.properTool ?? TOOL_ANY;
    this.properToolRequired = p.properToolRequired ?? false;
    this.requiredTier = p.requiredTier ?? TIER_ANY;
    this.breakTime = p.breakTime ?? 60;
    this.dropItem = p.dropItem ?? "block/"+id;

    this.eventInteract = p.eventInteract ?? (function(x,y) {});
    this.eventBreak = p.eventBreak ?? (function(x,y) {});

    if (p.template == "generic_wood") {
      this.breakTime = 60;
      this.properTool = TOOL_AXE;
    }
  }

  canBeMinedBy(item) {
    if (!this.properToolRequired) {
      return true;
    }
    let itype = 0;
    let itier = 0;
    if (item !== null) {
      itype = item.itemType.toolType;
      itier = item.itemType.toolTier;
    }
    return ((itype == this.properTool) && (itier >= this.requiredTier));
  }

  getBreakTime(item) {
    if (Game.instabreak) {return 2;}
    let t = this.breakTime;
    let itype = 0;
    let itier = 0;
    if (item !== null) {
      itype = item.itemType.toolType;
      itier = item.itemType.toolTier;
    }
    if (itype != this.properTool) {
      t *= 2;
    } else {
      const tierDiff = itier - this.requiredTier;
      const multiplier = 1 - (0.225*tierDiff);
      t *= multiplier;
    }
    return Math.max(t, 8);
  }

  getDrop() {
    let newItem;
    if (this.dropItem.substr(0, 6) == "block/") {
      const blockStr = this.dropItem.substr(6, this.dropItem.length-6);
      newItem = new Item({itemType: "block", count: 1, block: assets.block(blockStr)})
    } else {
      newItem = new Item({itemType: this.dropItem, count: 1})
    }
    return newItem;
  }
}

assets.addBlock("air", "blocks_natural", 0, {solid: false});

assets.addBlock("stone", "blocks_natural", 1, {
  name: "Stone",
  properTool: TOOL_PICKAXE,
  properToolRequired: true,
  breakTime: 60,
  dropItem: "block/cobblestone"
});

assets.addBlock("cobblestone", "blocks_natural", 4, {
  name: "Cobblestone",
  properTool: TOOL_PICKAXE,
  properToolRequired: true,
  breakTime: 60
});

assets.addBlock("dirt", "blocks_natural", 2, {
  name: "Dirt",
  properTool: TOOL_SHOVEL,
  breakTime: 30
});

assets.addBlock("grass", "blocks_natural", 3, {
  name: "Grass",
  properTool: TOOL_SHOVEL,
  breakTime: 30
});

assets.addBlock("crafting_table", "blocks_natural", 5, {
  name: "Crafting Table",
  template: "generic_wood",
  eventInteract: function(x, y) {
    Game.setGUIMode("crafting_table");
  }
});

assets.addBlock("log_oak", "blocks_wood", 1, {
  name: "Oak Log",
  template: "generic_wood"
});

assets.addBlock("leaves_oak", "blocks_wood", 0, {
  name: "Oak Leaves",
  fullyOpaque: false
});

assets.addBlock("planks_oak", "blocks_wood", 4, {
  name: "Oak Planks",
  template: "generic_wood"
});

assets.addBlock("door_to_oak", "blocks_wood", 5, {
  name: "Oak Door",
  template: "generic_wood",
  dropItem: "oak_door",
  fullyOpaque: false,
  solid: false,
  eventInteract: function(x, y) {
    if ((!Game.dim.tileObstructed(x, y)) && (!Game.dim.tileObstructed(x, y-1))) {
      Game.dim.tiles[x][y].block = assets.block("door_tc_oak");
      Game.dim.tiles[x][y-1].block = assets.block("door_bc_oak");
    }
  },
  eventBreak: function(x, y) {
    Game.dim.tiles[x][y-1].block = null;
  }
});

assets.addBlock("door_bo_oak", "blocks_wood", 6, {
  name: "Oak Door",
  template: "generic_wood",
  dropItem: "oak_door",
  fullyOpaque: false,
  solid: false,
  eventInteract: function(x, y) {
    if ((!Game.dim.tileObstructed(x, y)) && (!Game.dim.tileObstructed(x, y+1))) {
      Game.dim.tiles[x][y+1].block = assets.block("door_tc_oak");
      Game.dim.tiles[x][y].block = assets.block("door_bc_oak");
    }
  },
  eventBreak: function(x, y) {
    Game.dim.tiles[x][y+1].block = null;
  }
});

assets.addBlock("door_tc_oak", "blocks_wood", 7, {
  name: "Oak Door",
  template: "generic_wood",
  dropItem: "oak_door",
  fullyOpaque: false,
  eventInteract: function(x, y) {
    Game.dim.tiles[x][y].block = assets.block("door_to_oak");
    Game.dim.tiles[x][y-1].block = assets.block("door_bo_oak");
  },
  eventBreak: function(x, y) {
    Game.dim.tiles[x][y-1].block = null;
  }
});

assets.addBlock("door_bc_oak", "blocks_wood", 8, {
  name: "Oak Door",
  template: "generic_wood",
  dropItem: "oak_door",
  fullyOpaque: false,
  eventInteract: function(x, y) {
    Game.dim.tiles[x][y+1].block = assets.block("door_to_oak");
    Game.dim.tiles[x][y].block = assets.block("door_bo_oak");
  },
  eventBreak: function(x, y) {
    Game.dim.tiles[x][y+1].block = null;
  }
});

// @items
// ITEMS

class ItemType {
  constructor(id, texture, textureIndex, properties) {
    this.id = id;
    this.texture = assets.texture(texture);
    this.textureIndex = textureIndex;
    this.name = properties.name;
    this.category = properties.category ?? ITEMCAT_ITEM;
    this.stackable = properties.stackable ?? true;
    this.toolType = properties.toolType ?? 0;
    this.toolTier = properties.toolTier ?? 0;
    this.eventUse = properties.eventUse ?? (function() {});
  }
}

assets.addItemType("block", null, 0, {
  name: "Block",
  category: ITEMCAT_BLOCK
});

assets.addItemType("oak_door", "items1", 0, {
  name: "Oak Door",
  category: ITEMCAT_ITEM,
  eventUse: function() {
    if (
      (!Game.dim.tileObstructed(Game.hoveredBlockX, Game.hoveredBlockY)) &&
      (!Game.dim.tileObstructed(Game.hoveredBlockX, Game.hoveredBlockY+1)) &&
      (Game.dim.tiles[Game.hoveredBlockX][Game.hoveredBlockY-1].block !== null) &&
      (Game.dim.tiles[Game.hoveredBlockX][Game.hoveredBlockY].block === null) &&
      (Game.dim.tiles[Game.hoveredBlockX][Game.hoveredBlockY+1].block === null)
    ) {
      if (Game.dim.tiles[Game.hoveredBlockX][Game.hoveredBlockY-1].block.solid) {
        Game.dim.tiles[Game.hoveredBlockX][Game.hoveredBlockY].block = assets.block("door_bc_oak");
        Game.dim.tiles[Game.hoveredBlockX][Game.hoveredBlockY+1].block = assets.block("door_tc_oak");
        Game.player.inv.reduce(Game.hotbarCursor);
      }
    }
  }
});

assets.addItemType("stick", "tools", 0, {
  name: "Stick",
  category: ITEMCAT_ITEM
});

assets.addItemType("wooden_pickaxe", "tools", 1, {
  name: "Wooden Pickaxe",
  category: ITEMCAT_TOOL,
  stackable: false,
  toolType: TOOL_PICKAXE,
  toolTier: TIER_WOOD
});

assets.addItemType("wooden_axe", "tools", 4, {
  name: "Wooden Axe",
  category: ITEMCAT_TOOL,
  stackable: false,
  toolType: TOOL_AXE,
  toolTier: TIER_WOOD
});

class Item {
  constructor(params) {
    this.itemType = assets.itemType(params.itemType);
    this.block = null;
    if (this.itemType.category == ITEMCAT_BLOCK) {
      this.block = params.block;
      this.name = this.block.name;
    } else {
      this.name = this.itemType.name;
    }
    this.count = params.count ?? 1;
  }

  copy() {
    return new Item({
      itemType: this.itemType.id,
      block: this.block,
      count: this.count
    });
  }

  willStackWith(otherItem) {
    if ((!this.itemType.stackable) || (!otherItem.itemType.stackable)) {
      return false;
    } else {
      if ((this.itemType == otherItem.itemType) && (this.block == otherItem.block)) {
        return true;
      } else {
        return false;
      }
    }
  }
}

// @entities
// ENTITIES

class Species {
  constructor(properties) {
    this.hitboxWidth = properties.hitboxWidth;
    this.hitboxHeight = properties.hitboxHeight;
    this.texture = properties.texture;
    this.maxHP = properties.maxHP ?? 10;
    this.moveSpeed = properties.moveSpeed ?? 2;
    this.jumpSpeed = properties.jumpSpeed ?? 5;

    this.logicInitialize = properties.logicInitialize ?? [behaviors.Initialize_GenericWalker];
    this.logicAI = properties.logicAI ?? [behaviors.AI_GenericWalker];
    this.logicControl = properties.logicControl ?? [behaviors.Control_GenericWalker];
    this.logicAnimation = properties.logicAnimation ?? [behaviors.Animation_GenericWalker];
    this.logicDraw = properties.logicDraw ?? [behaviors.Draw_Generic];
  }
}

class Entity {
  constructor(species, x, y, params) {
    this.species = species;
    this.x = x;
    this.y = y;
    this.params = params??{}; // any parameters the entity is spawned with; the species' initialize function deals with them

    this.dead = false; //
    this.facing = true; // T: right, F: left
    this.grounded = false;
    this.dx = 0;
    this.dy = 0;

    this.walkCycle = 0;
    this.sprite = 0;

    this.AI = {};
    for (let i=0; i<this.species.logicInitialize.length; i++) {
      this.species.logicInitialize[i](this);
    }
  }

  solidBelow() {
    return (
      (Game.dim.blockAt(this.x+1, this.y-1).solid) ||
      (Game.dim.blockAt(this.x+(this.species.hitboxWidth/2), this.y-1).solid) ||
      (Game.dim.blockAt(this.x+this.species.hitboxWidth-1, this.y-1).solid)
    );
  }
  insideSolidBelow() {
    return (
      (Game.dim.blockAt(this.x+1, this.y).solid) ||
      (Game.dim.blockAt(this.x+(this.species.hitboxWidth/2), this.y).solid) ||
      (Game.dim.blockAt(this.x+this.species.hitboxWidth-1, this.y).solid)
    );
  }

  solidAbove() {
    return (
      (Game.dim.blockAt(this.x+1, this.y+this.species.hitboxHeight).solid) ||
      (Game.dim.blockAt(this.x+(this.species.hitboxWidth/2), this.y+this.species.hitboxHeight).solid) ||
      (Game.dim.blockAt(this.x+this.species.hitboxWidth-1, this.y+this.species.hitboxHeight).solid)
    );
  }
  insideSolidAbove() {
    return (
      (Game.dim.blockAt(this.x+1, this.y+this.species.hitboxHeight-1).solid) ||
      (Game.dim.blockAt(this.x+(this.species.hitboxWidth/2), this.y+this.species.hitboxHeight-1).solid) ||
      (Game.dim.blockAt(this.x+this.species.hitboxWidth-1, this.y+this.species.hitboxHeight-1).solid)
    );
  }

  solidRight() {
    return (
      (Game.dim.blockAt(this.x+this.species.hitboxWidth+1, this.y).solid) ||
      (Game.dim.blockAt(this.x+this.species.hitboxWidth+1, this.y+this.species.hitboxHeight).solid)
    );
  }
  insideSolidRight() {
    return (
      (Game.dim.blockAt(this.x+this.species.hitboxWidth, this.y+8).solid) ||
      (Game.dim.blockAt(this.x+this.species.hitboxWidth, this.y+this.species.hitboxHeight-8).solid)
    );
  }

  solidLeft() {
    return (
      (Game.dim.blockAt(this.x-1, this.y).solid) ||
      (Game.dim.blockAt(this.x-1, this.y+this.species.hitboxHeight).solid)
    );
  }
  insideSolidLeft() {
    return (
      (Game.dim.blockAt(this.x, this.y+15).solid) ||
      (Game.dim.blockAt(this.x, this.y+this.species.hitboxHeight-15).solid)
    );
  }

  doLogic() {
    for (let i=0; i<this.species.logicAI.length; i++) {
      this.species.logicAI[i](this);
    }
    for (let i=0; i<this.species.logicControl.length; i++) {
      this.species.logicControl[i](this);
    }
    this.logicPhysics();
    for (let i=0; i<this.species.logicAnimation.length; i++) {
      this.species.logicAnimation[i](this);
    }
  }

  logicPhysics() {

    // LATERAL MVMT
    // if moving right and collide with wall
    if ((this.dx > 0) && (this.solidRight())) {
      this.dx = 0;
    }
    // if moving left and collide with wall
    if ((this.dx < 0) && (this.solidLeft())) {
      this.dx = 0;
    }
    this.x += this.dx;

    // lateral inblock position adjustment
    if (this.insideSolidRight()) {
      this.x = Game.dim.bordersAt(this.x+this.species.hitboxWidth, this.y).left - this.species.hitboxWidth;
    }
    if (this.insideSolidLeft()) {
      this.x = Game.dim.bordersAt(this.x, this.y).right+1;
    }

    // VERTICAL MVMT
    // if grounded and walking off edge
    if ((this.grounded)&&(this.dy >= 0)) {
      if (!this.solidBelow()) {
        this.grounded = false;
      }
    }
    if (!this.grounded) {
      // if not grounded, apply gravity
      this.dy -= 0.3;
      if (this.dy < -10) {
        this.dy = -10;
      }
      // if falling, check blocks below
      if (this.dy < 0) {
        if (this.solidBelow()) {
          this.y = Math.floor(this.y);
          this.grounded = true;
          this.dy = 0;
        }
      }
      // if ascending, check blocks above
      if (this.dy > 0) {
        if (this.solidAbove()) {
          this.dy = 0;
        }
      }
    }
    this.y += this.dy;

    // vertical inblock position adjustment
    if (this.insideSolidBelow()) {
      this.y = Game.dim.bordersAt(this.x, this.y).top;
    }
    if (this.insideSolidAbove()) {
      this.y = Game.dim.bordersAt(this.x, this.y+this.species.hitboxHeight).bottom - this.species.hitboxHeight;
    }

    // FRICTION
    if (this.dx != 0) {
      let dir = Math.sign(this.dx);
      this.dx -= dir*0.3;
      if (
        ((dir == 1)&&(this.dx < 0)) ||
        ((dir == -1)&&(this.dx > 0))
      ) {
        this.dx = 0;
      }
    }

    // WORLD BOUNDS
    if (this.x < 0) {
      this.x = 0;
    }
    if (this.x > Game.dim.width*16 - this.species.hitboxWidth) {
      this.x = Game.dim.width*16 - this.species.hitboxWidth;
    }
  }
}

// @behavior
// BEHAVIOR FUNCTIONS

let behaviors = {};

// PLAYER

behaviors.Initialize_Player = function(me) {
  me.inv = new Inventory(50);
  me.craftInv = new Inventory(9);
  me.craftResultInv = new Inventory(1);

  Game.setGUIMode("hotbar");

  gui_hotbar.assignSlots(0, 10, 0, me.inv);
  gui_inventory.assignSlots(0, 50, 0, me.inv);
  gui_crafting_table.assignSlots(0, 9, 0, me.craftInv);
  gui_crafting_table.assignSlots(9, 1, 0, me.craftResultInv);
  gui_inventory_with_crafting.assignSlots(0, 50, 0, me.inv);
  gui_inventory_with_crafting.assignSlots(50, 1, 0, me.craftInv);
  gui_inventory_with_crafting.assignSlots(51, 1, 1, me.craftInv);
  gui_inventory_with_crafting.assignSlots(52, 1, 3, me.craftInv);
  gui_inventory_with_crafting.assignSlots(53, 1, 4, me.craftInv);
  gui_inventory_with_crafting.assignSlots(54, 1, 0, me.craftResultInv);

  me.breaking = false;
  me.breakingX = 0;
  me.breakingY = 0;
  me.breakTime = 0;
  me.breakTimeMax = 0; 
  me.placing = false;

  me.swinging = false;
  me.swingCycle = 0;
  me.swingSprite = 0;
}

behaviors.AI_Player = function(me) {

  // WALL MODE BUTTON
  if (controlMap.get("wallMode").state) {
    Game.wallMode = !Game.wallMode;
    controlMap.get("wallMode").state = false;
    me.breaking = false;
  }

  // OPEN INV BUTTON
  if (controlMap.get("openInv").state) {
    Game.hoveredSlot = -1;
    if (Game.guiMode == "hotbar") {
      Game.setGUIMode("inventory_with_crafting");
    } else {
      Game.setGUIMode("hotbar");
    }
    controlMap.get("openInv").state = false;
  }

  // MOVEMENT CONTROLS

  if (controlMap.get("moveLeft").state) {
    me.AI.isWalking = true;
    me.AI.walkingDir = false;
  }
  else if (controlMap.get("moveRight").state) {
    me.AI.isWalking = true;
    me.AI.walkingDir = true;
  } else {
    me.AI.isWalking = false;
  }
  if (controlMap.get("jump").state) {
    me.AI.isJumping = true;
  }

  // BLOCK PLACING
  const targetTile = Game.dim.tiles[Game.hoveredBlockX][Game.hoveredBlockY];
  const heldItem = Game.playerHeldItem();
  if ((me.placing) && (heldItem === null)) {
    me.placing = false;
  }
  if (me.placing) {
    // in wall mode: place wall if there's no wall there
    if (
      (Game.wallMode) &&
      (targetTile.wall == null)
    ) {
      // place wall if the held block allows it
      if (heldItem.block.wallable) {
        if (me.swingCycle == 0) {me.swingCycle = 20;}
        targetTile.wall = heldItem.block;
        targetTile.wallIsNatural = false;
        me.inv.reduce(Game.hotbarCursor);
      }
    }
    // not wall mode: place block if there's no block there
    else if (
      (!Game.wallMode) &&
      (targetTile.block == null)
    ) {
      // place block if the target tile isn't obstructed
      if (!Game.dim.tileObstructed(Game.hoveredBlockX, Game.hoveredBlockY)) {
        if (me.swingCycle == 0) {me.swingCycle = 20;}
        targetTile.block = heldItem.block;
        me.inv.reduce(Game.hotbarCursor);
        doRightClickEvent = false;
      }
    }
  }

  // BLOCK BREAKING
  // begin breaking block
  if ((!Game.wallMode)&&(me.swinging)&&(!me.breaking)) {
    if (targetTile.block !== null) {
      if (targetTile.block.canBeMinedBy(Game.playerHeldItem())) {
        me.breaking = true;
        me.breakingX = Game.hoveredBlockX;
        me.breakingY = Game.hoveredBlockY;
        me.breakTimeMax = Game.dim.tiles[me.breakingX][me.breakingY].block.getBreakTime(Game.playerHeldItem());
        me.breakTime = Game.dim.tiles[me.breakingX][me.breakingY].block.getBreakTime(Game.playerHeldItem());
      }
    }
  }
  // begin breaking wall (if there is no block in front)
  if ((Game.wallMode)&&(me.swinging)&&(!me.breaking)) {
    if (
      (targetTile.wall !== null)&&
      (targetTile.block === null)
    ) {
      if (targetTile.wall.canBeMinedBy(Game.playerHeldItem())) {
        me.breaking = true;
        me.breakingX = Game.hoveredBlockX;
        me.breakingY = Game.hoveredBlockY;
        me.breakTimeMax = targetTile.wall.getBreakTime(Game.playerHeldItem());
        me.breakTime = targetTile.wall.getBreakTime(Game.playerHeldItem());
      }
    }
  }
  if (me.breaking) {
    // player hovers a different block while breaking
    if ((Game.hoveredBlockX != me.breakingX) || (Game.hoveredBlockY != me.breakingY)) {
      me.breaking = false;
    }
    // block/wall is broken
    else if (me.breakTime <= 0) {
      me.breaking = false;
      if (!Game.wallMode) {
        Game.dim.summon("droppedItem", me.breakingX*16, me.breakingY*16, {item: targetTile.block.getDrop()});
        targetTile.block.eventBreak(me.breakingX, me.breakingY);
        targetTile.block = null;
      } else {
        if (!Game.dim.tiles[me.breakingX][me.breakingY].wallIsNatural) {
          Game.dim.summon("droppedItem", me.breakingX*16, me.breakingY*16, {item: targetTile.wall.getDrop()});
        }
        targetTile.wall = null;
      }
    } else {
      me.breakTime--;
    }
  }
}

behaviors.Draw_Player = function(me) {
  const x = me.x;
  const y = me.y - me.species.hitboxHeight;
  const tw = me.species.texture.width;
  const th = me.species.texture.height;
  const hw = me.species.hitboxWidth;
  const hh = me.species.hitboxHeight;
  drawTexture(assets.texture("steve_arms"), me.swingSprite, x + ((hw-tw)/2), y + (hh+th)+20);
  ctx.fillStyle = "#ff000080";
}

behaviors.Animation_Player = function(me) {
  let s = 0;
  if ((me.swinging)||(me.swingCycle > 0)) {
    me.swingCycle--;
  } 
  if ((me.swinging)&&(me.swingCycle<=0)) {
    me.swingCycle = 20;
  }
  if (me.swingCycle > 16) {
    s = 1;
  }
  else if (me.swingCycle > 12) {
    s = 2;
  }
  else if (me.swingCycle > 8) {
    s = 3;
  }
  else if (me.swingCycle > 4) {
    s = 0;
  }
  if (me.AI.walkingDir) {
    s = 7-s;
  }
  me.swingSprite = s;

}

// DROPPED ITEM

behaviors.Initialize_DroppedItem = function(me) {
  me.item = me.params.item;
  me.noJitter = me.params.noJitter ?? false;
  if (!me.noJitter) {
    me.dx = randomRange(-4,4);
    me.dy = 2;
  }
}

behaviors.Control_DroppedItem = function(me) {
  if (Game.entityCollision(me, Game.player)) {
    if (Game.player.inv.collect(me.item)) {
      // todo: optimize
      me.dead = true;
    }
  }
}

behaviors.Animate_DroppedItem = function(me) {
  me.walkCycle++;
  if (me.walkCycle > 60) {
    me.walkCycle = 0;
  }
}

behaviors.Draw_DroppedItem = function(me) {
  const scale = Math.sin((2*Math.PI*me.walkCycle)/60);
  const x = me.x - 8*scale + 8 ;
  const y = me.y + 16;
  let tex;
  let texIndex;
  if (me.item.itemType.category == ITEMCAT_BLOCK) {
    tex = me.item.block.texture;
    texIndex = me.item.block.textureIndex;
  } else {
    tex = me.item.itemType.texture;
    texIndex = me.item.itemType.textureIndex;
  }
  drawTexture(tex, texIndex, x, y, scale);
  if (me.item.count != 1) {
    drawText(String(me.item.count), canvasX(me.x+16), canvasY(me.y-2), "MCRegular", "#ffffff", camera.zoom, "right", 3, "#000000");
  }
}

// GENERIC

behaviors.Draw_Generic = function(me) {
  const x = me.x;
  const y = me.y - me.species.hitboxHeight;
  const tw = me.species.texture.width;
  const th = me.species.texture.height;
  const hw = me.species.hitboxWidth;
  const hh = me.species.hitboxHeight;
  drawTexture(me.species.texture, me.sprite, x + ((hw-tw)/2), y + (hh+th));
}

behaviors.Initialize_GenericWalker = function(me) {
  me.AI.isWalking = false;
  me.AI.walkingDir = true;
  me.AI.isJumping = false;
}

behaviors.AI_GenericWalker = function(me) {
  // 1% chance to start/stop walking
  if (Math.random() > 0.99) {
    me.AI.isWalking = !me.AI.isWalking;
  }
  // 1% chance to change directions
  if (Math.random() > 0.99) {
    me.AI.walkingDir = !me.AI.walkingDir;
  }
  // jump if bumping into wall
  if (me.AI.isWalking) {
    if ((me.AI.walkingDir) && (me.solidRight())) {me.AI.isJumping = true;}
    if ((!me.AI.walkingDir) && (me.solidLeft())) {me.AI.isJumping = true;}
  }
}

behaviors.Control_GenericWalker = function(me) {
  // move states
  if (me.AI.isWalking) {
    if (me.AI.walkingDir) {
      me.dx += 0.5;
      if (me.dx > me.species.moveSpeed) {me.dx = me.species.moveSpeed;}
    } else {
      me.dx -= 0.5;
      if (me.dx < -me.species.moveSpeed) {me.dx = -me.species.moveSpeed;}
    }
  }
  if (me.AI.isJumping) {
    me.AI.isJumping = false;
    if (me.grounded) {
      me.grounded = false;
      me.dy = me.species.jumpSpeed;
    }
  }
}

behaviors.Animation_GenericWalker = function(me) {
  let s = 0;
  if (!me.grounded) {
    s = 2;
  } else {
    if (!me.AI.isWalking) {
      me.walkCycle = 0;
      s = 0;
    } else {
      me.walkCycle++;
      if (me.walkCycle>=16) {
        me.walkCycle = 0;
      }
      if (me.walkCycle<4) {
        s = 0;
      }
      else if (me.walkCycle<8) {
        s = 1;
      }
      else if (me.walkCycle<12) {
        s = 2;
      }
      else if (me.walkCycle<16) {
        s = 1;
      }
    }
  }
  if (me.AI.walkingDir) {
    s = 5-s;
  }
  me.sprite = s;
}

// @species
// SPECIES DEFINITIONS

assets.addSpecies("player", {
  hitboxWidth: 10,
  hitboxHeight: 24,
  texture: assets.texture("steve_legs"),
  maxHP: 20,
  moveSpeed: 2,
  jumpSpeed: 5,
  logicInitialize: [behaviors.Initialize_GenericWalker, behaviors.Initialize_Player],
  logicAI: [behaviors.AI_Player],
  logicControl: [behaviors.Control_GenericWalker],
  logicAnimation: [behaviors.Animation_GenericWalker, behaviors.Animation_Player],
  logicDraw: [behaviors.Draw_Generic, behaviors.Draw_Player]
});

assets.addSpecies("droppedItem", {
  hitboxWidth:16,
  hitboxHeight:16,
  texture: assets.texture("blocks"),
  logicInitialize: [behaviors.Initialize_DroppedItem],
  logicAI: [],
  logicControl: [behaviors.Control_DroppedItem],
  logicAnimation: [behaviors.Animate_DroppedItem],
  logicDraw: [behaviors.Draw_DroppedItem]
});

assets.addSpecies("pig", {
  hitboxWidth: 24,
  hitboxHeight: 16,
  texture: assets.texture("pig"),
  maxHP: 10,
  moveSpeed: 1,
  jumpSpeed: 4.25
});

// @inv
// INVENTORY FORMAT

class Inventory {
  constructor(size) {
    this.size = size;
    this.contents = new Array(this.size);
    for (let i=0; i<this.size; i++) {
      this.contents[i] = null;
    }
  }

  // reduces the item's count at the given index by 1,
  // setting that slot to null if it reaches 0

  reduce(index) {
    if (this.contents[index] instanceof Item) {
      this.contents[index].count--;
      if (this.contents[index].count == 0) {
        this.contents[index] = null;
      }
    }
  }

  // add an item to this inv, stacking where appropriate
  // returns true if successful, false if inv is full
  collect(item) {
    for (const i in this.contents) {
      if (this.contents[i] != null) {
        if (this.contents[i].willStackWith(item)) {
          this.contents[i].count += item.count;
          return true;
        }
      }
    }
    for (const i in this.contents) {
      if (this.contents[i] === null) {
        this.contents[i] = item;
        return true;
      }
    }
    return false;
  }
}

// @gui
// GUI

class Slot {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.referencedInv = null;
    this.index = null;
  }

  getItem() {
    return this.referencedInv.contents[this.index];
  }

  setItem(item) {
    this.referencedInv.contents[this.index] = item;
  }
}

class GUI {
  constructor(texture, title, slotConfiguration) {
    this.title = title ?? null;
    this.texture = texture;
    this.width = texture.width;
    this.height = texture.height;
    this.x = 8;
    this.y = 8;
    this.slotList = [];
    let i = 0;
    for (const j in slotConfiguration) {
      for (let yi=0; yi<slotConfiguration[j][3]; yi++) {
        for (let xi=0; xi<slotConfiguration[j][2]; xi++) {
          let slotX = slotConfiguration[j][0] + xi*20;
          let slotY = slotConfiguration[j][1] + yi*20;
          this.slotList[i] = new Slot(slotX, slotY);
          i++;
        }
      }
    }
  }

  assignSlots(guiStartIndex, amount, invStartIndex, inv) {
    for (let i=0; i<amount; i++) {
      this.slotList[guiStartIndex+i].referencedInv = inv;
      this.slotList[guiStartIndex+i].index = invStartIndex + i;
    }
  }
}

// slot configuration format: [x, y, columns, rows]

let gui_hotbar = new GUI(
  assets.texture("hotbar"), null,
  [ [7, 7, 10, 1] ]
);

let gui_inventory_with_crafting = new GUI(
  assets.texture("inventory_with_crafting"), null,
  [ [7, 7, 10, 1], [7, 33, 10, 4], [213, 53, 2, 2], [273, 64, 1, 1] ]
);

let gui_inventory = new GUI(
  assets.texture("inventory"), null,
  [ [7, 7, 10, 1], [7, 33, 10, 4] ]
);

let gui_crafting_table = new GUI(
  assets.texture("crafting_table"), "Crafting",
  [ [7, 17, 3, 3], [87, 37, 1, 1] ]
);

// @dimension
// DIMENSION / WORLD FORMAT

class Tile {
  constructor() {
    this.block = null;
    this.blockVariant = 0;
    this.wall = null;
    this.wallIsNatural = true;
  }
}

class Dimension {
  constructor(width, height, generator, genParams) {
    // initialize world
    this.width = width;
    this.height = height;
    this.tiles = [];
    for (let i=0; i<width; i++) {
      this.tiles[i] = new Array(height);
      for (let j=0; j<height; j++) {
        this.tiles[i][j] = new Tile();
      }
    }
    this.entities = [Game.player];

    // generate terrain using the given worldgen function
    generator(this, genParams);

    // find 2-block gap to spawn player
    Game.player.x = width*8;
    let mid = Math.floor(width/2);
    for (let i=0; i<this.tiles[mid].length-1; i++) {
      if ((this.tiles[mid][i].block == null)&&(this.tiles[mid][i+1].block == null)) {
        Game.player.y = i*16;
        break;
      }
    }
  }

  summon(mobStr, x, y, params) {
    let newEntity = this.entities.push(new Entity(assets.species(mobStr), x??Game.player.x, y??(Game.player.y), params??{} ));
    Game.loadEntities();
    return newEntity;
  }

  tileObstructed(bx, by) {
    const btlx = bx*16;
    const bbrx = bx*16 + 15;
    const btly = by*16;
    const bbry = by*16 - 15;
    for (const i in Game.loadedEntities) {
      const e = Game.loadedEntities[i];
      const etlx = e.x;
      const ebrx = e.x + e.species.hitboxWidth;
      const etly = e.y + e.species.hitboxHeight;
      const ebry = e.y;
      if (
        (btlx <= ebrx) &&
        (bbrx >= etlx) &&
        (btly >= ebry) &&
        (bbry <= etly)
      ) {
        return true;
      }
    }
    return false;
  }

  blockAt(x, y) {
    let xIndex = Math.floor(x/16);
    let yIndex = Math.floor(y/16);
    if (xIndex < 0) {
      xIndex = 0;
    }
    if (xIndex >= this.width) {
      xIndex = this.width-1;
    }
    let block = this.tiles[xIndex][yIndex].block;
    if ((block == undefined) || (block == null)) {
      block = assets.block("air");
    }
    return block;
  }

  blockCoordsAt(x, y) {
    let xIndex = Math.floor(x/16);
    let yIndex = Math.floor(y/16);
    if (xIndex < 0) {
      xIndex = 0;
    }
    if (xIndex >= this.width) {
      xIndex = this.width-1;
    }
    return [xIndex, yIndex];
  }

  bordersAt(x, y) {
    return {
      left: Math.floor(x/16)*16,
      top: Math.floor(y/16)*16 + 16,
      right: Math.floor(x/16)*16 + 15,
      bottom: Math.floor(y/16)*16 + 1
    }
  }
}


// @renderer
// RENDERER

const DOMCanvas = document.getElementById("CanvasMain");
const DOMBackdrop1 = document.getElementById("GameBackdrop1");
const DOMBackdrop2 = document.getElementById("GameBackdrop2");
const ctx = DOMCanvas.getContext("2d");

// monitors
const DOMMonitor0 = document.getElementById("Monitor0");
const DOMMonitor1 = document.getElementById("Monitor1");
const DOMSetting0 = document.getElementById("Setting0");
const DOMSetting1 = document.getElementById("Setting1");
const DOMSetting2 = document.getElementById("Setting2");
const DOMSetting3 = document.getElementById("Setting3");

const camera = {
  zoom: 2,
  guiScale: 2,
  width: 1024,
  height: 512,
  x: 0,
  y: 0,
  bgWidth: 1400,
  bgHeight: 1400,
  bgScrollX: 0,
  resize: function(w, h) {
    if (w <= 600) {
      camera.guiScale = 1;
    } else {
      camera.guiScale = 2;
    }
    camera.width = w;
    camera.height = h;
    DOMCanvas.width = camera.width;
    DOMCanvas.height = camera.height;
    DOMCanvas.style.width = String(camera.width) + "px";
    DOMCanvas.style.height = String(camera.height) + "px";
    DOMBackdrop1.style.width = String(camera.width) + "px";
    DOMBackdrop1.style.height = String(camera.height) + "px";
  },
  autoResize: function() {
    camera.resize(window.innerWidth-64,window.innerHeight-64);
  },
  loop: function() {
    this.x = Math.floor(Game.player.x - (this.width/2)/camera.zoom);
    this.y = Math.floor(-Game.player.y + (this.height/2)/camera.zoom);
    Game.updateCursor();
    this.bgScrollX += 0.25;
    if (this.bgScrollX>this.bgWidth) {
      this.bgScrollX = 0;
    }
    const bgX = Math.round((-Game.player.x * camera.zoom *0.5)%this.bgWidth + this.bgScrollX);
    const bgY = Math.round((Game.player.y * camera.zoom *0.5)%this.bgHeight);
    DOMBackdrop1.style.backgroundPosition = `${bgX}px ${bgY}px`;
  }
};

// convert canvas coords to game coords
function gameX(n) {
  return camera.x + n/camera.zoom;
}
function gameY(n) {
  return (camera.height - n)/camera.zoom - camera.y
}

// convert game coords to canvas coords
function canvasX(n) {
  return Math.floor((n-camera.x)*camera.zoom);
}
function canvasY(n) {
  return Math.floor(camera.height-(n+camera.y)*camera.zoom);
}

function drawTexture(tex, index, x, y, xscale, yscale, absolute) {
  let scaleX = xscale ?? 1;
  let scaleY = yscale ?? 1;
  let a = absolute ?? false;
  let sx = (index%tex.columns) * tex.width;
  let sy = Math.floor(index/tex.columns) * tex.height;
  let zoom = 1;
  if (!a) {
    x = canvasX(x);
    y = canvasY(y);
    zoom = camera.zoom;
  }
  ctx.drawImage(tex.img, sx, sy, tex.width, tex.height, x, y, scaleX*tex.width*zoom, scaleY*tex.height*zoom);
}

function drawTerrain() {
  for (let i=Game.renderLeft; i<Game.renderRight; i++) {
    for (let j=0; j<Game.dim.tiles[i].length; j++) {
      const x = i * 16;
      const y = (j+1) * 16;
      const t = Game.dim.tiles[i][j];
      if (t.wall instanceof Block) {
        if (t.block === null) {
          drawTexture(t.wall.texture_w, t.wall.textureIndex, x, y);
        } else {
          if (!t.block.fullyOpaque) {
            drawTexture(t.wall.texture_w, t.wall.textureIndex, x, y);
          }
        }
      }
      if (t.block instanceof Block) {
        drawTexture(t.block.texture, t.block.textureIndex, x, y);
      }
    }
  }
}

function drawHitbox(me) {
  const x = me.x;
  const y = me.y + me.species.hitboxHeight;
  const hw = me.species.hitboxWidth;
  const hh = me.species.hitboxHeight;
  ctx.fillStyle = "#ff0000c0"
  ctx.fillRect(canvasX(x), canvasY(y), hw*camera.zoom, hh*camera.zoom);
}

function drawBlockCursor() {
  ctx.lineWidth = 1;
  if (!Game.player.breaking) {
    ctx.fillStyle = "#ffffff40";
    ctx.strokeStyle = "#ffffff";
    ctx.fillRect(canvasX(Game.hoveredBlockX*16), canvasY(Game.hoveredBlockY*16+16), camera.zoom*16, camera.zoom*16);
  } else {
    ctx.strokeStyle = "#000000";
  }
  ctx.strokeRect(canvasX(Game.hoveredBlockX*16), canvasY(Game.hoveredBlockY*16+16), camera.zoom*16, camera.zoom*16);
}

function drawInvItem(item, x, y) {
  let tex;
  let texIndex;
  if (item.itemType.category == ITEMCAT_BLOCK) {
    tex = item.block.texture;
    texIndex = item.block.textureIndex;
  } else {
    tex = item.itemType.texture;
    texIndex = item.itemType.textureIndex;
  }
  drawTexture(tex, texIndex, x, y, camera.guiScale, camera.guiScale, true);
  if (item.count != 1) {
    drawText(String(item.count), x+16*camera.guiScale, y+16*camera.guiScale, "MCRegular", "#ffffff", camera.guiScale, "right", 3, "#000000");
  }
}

function drawText(str, x, y, fontFamily, color, scale, align, lineWidth, lineColor) {
  ctx.textAlign = align ?? "left";
  ctx.font = `${10*scale}px ${fontFamily}`;
  ctx.fillStyle = color;
  if ((lineWidth??0) > 0) {
    ctx.strokeStyle = lineColor;
    ctx.lineWidth = lineWidth;
    ctx.strokeText(str, x, y);
  }
  ctx.fillText(str, x, y);
}

function drawTooltip() {
  if (Game.hoveredSlot.getItem() !== null) {
    const s = camera.guiScale;
    const startX = Game.mouseX + 12;
    const startY = Game.mouseY + 12;
    const str = Game.hoveredSlot.getItem().name;
    const w = ctx.measureText(str).width;
    ctx.fillStyle = "#0080ff"
    drawTexture(assets.texture("tooltip_cap"), 0, startX, startY, s, s, true);
    drawTexture(assets.texture("tooltip_mid"), 0, startX + s*(6), startY, w, s, true);
    drawTexture(assets.texture("tooltip_cap"), 1, startX + s*(6) + w, startY, s, s, true);
    drawText(str, startX + s*6, startY + s*11, "MCRegular", "#ffffff", s);
  }
}


// Main rendering function
// @mainrender
let c__ticks = 0;
let c__lastTime = Date.now();

function render() {
  if (
    (assets.loadedTextures == assets.numTextures) &&
    (assets.loadedFonts == assets.numFonts) 
  ) {
    if (ctx.imageSmoothingEnabled) {ctx.imageSmoothingEnabled = false;}

    // CLEAR CANVAS
    ctx.clearRect(0, 0, camera.width, camera.height);

    // DRAW TERRAIN
    drawTerrain();
    if (Game.player.breaking) {
      const crackStage = Math.round(9-(Game.player.breakTime/Game.player.breakTimeMax)*9);
      drawTexture(assets.texture("cracks"), crackStage, Game.player.breakingX*16, Game.player.breakingY*16+16);
    }

    // DRAW ENTITIES
    for (const i in Game.loadedEntities) {
      const e = Game.loadedEntities[i];
      for (let i=0; i<e.species.logicDraw.length; i++) {
        e.species.logicDraw[i](e);
      }
      if (Game.drawHitboxes) {
        drawHitbox(e);
      }
    }

    // DRAW HOVERED BLOCK
    drawBlockCursor();

    // DRAW INFO
    const heldItem = Game.playerHeldItem();
    let infoStr1 = ((heldItem === null) ? ("Hand") : (heldItem.name));
    let infoStr2 = ((Game.wallMode) ? ("Wall layer (Press E to toggle)") : ("Block layer (Press E to toggle)"));
    drawText(infoStr1, 12*camera.guiScale, 54*camera.guiScale, "MCRegular", "#ffffff", camera.guiScale, "left", 3, "#000000")
    drawText(infoStr2, 12*camera.guiScale, 69*camera.guiScale, "MCRegular", "#ffffff", camera.guiScale, "left", 3, "#000000")

    // DRAW GUI BACKGROUNDS
    for (const i in Game.gui) {
      const startX = Game.gui[i].x*camera.guiScale;
      const startY = Game.gui[i].y*camera.guiScale;
      drawTexture(Game.gui[i].texture, 0, startX, startY, camera.guiScale, camera.guiScale, true);
      if (Game.gui[i].title !== null) {
        drawText(Game.gui[i].title, startX+(7*camera.guiScale), startY+(13*camera.guiScale), "MCRegular", "#606060", camera.guiScale);
      }
    }

    // DRAW GUI ITEMS
    for (const i in Game.gui) {
      for (const j in Game.gui[i].slotList) {
        const slot = Game.gui[i].slotList[j];
        if (slot.getItem() !== null) {
          drawInvItem(slot.getItem(), (Game.gui[i].x + slot.x + 2)*camera.guiScale, (Game.gui[i].y + slot.y + 2)*camera.guiScale);
        }
      }
    }
    
    // DRAW HOVERED GUI SLOT
    if ((Game.hoveredGUI != -1) && (Game.hoveredSlot !== null)) {
      const gui = Game.gui[Game.hoveredGUI];
      ctx.fillStyle = "#ffffff80"
      ctx.fillRect(camera.guiScale*(gui.x + Game.hoveredSlot.x), camera.guiScale*(gui.y + Game.hoveredSlot.y), 20*camera.guiScale, 20*camera.guiScale);
    }

    // DRAW HOTBAR CURSOR
    const hc_pos = 20*Game.hotbarCursor;
    drawTexture(assets.texture("hotbar_cursor"), 0, (Game.gui[0].x+5+hc_pos)*camera.guiScale, (Game.gui[0].y+5)*camera.guiScale, camera.guiScale, camera.guiScale, true);

    // DRAW TOOLTIP
    if (Game.hoveredSlot!==null) {
      drawTooltip();
    }

    // DRAW GRABBED ITEM
    if (Game.grabbedItem !== null) {
      drawInvItem(Game.grabbedItem, Game.mouseX, Game.mouseY);
    }

    // DRAW CURSOR
    const targetTile = Game.dim.tiles[Game.hoveredBlockX][Game.hoveredBlockY];
    if (Game.wallMode) {
      if (targetTile.wall !== null) {
        if (targetTile.wall.canBeMinedBy(Game.playerHeldItem())) {
          drawTexture(assets.texture("cursor"), 0, Game.mouseX, Game.mouseY, 2, 2, true);
        } else {
          drawTexture(assets.texture("cursor_no"), 0, Game.mouseX, Game.mouseY, 2, 2, true);
        }
      } else {
        drawTexture(assets.texture("cursor"), 0, Game.mouseX, Game.mouseY, 2, 2, true);
      }
    } else {
      if (targetTile.block !== null) {
        if (targetTile.block.canBeMinedBy(Game.playerHeldItem())) {
          drawTexture(assets.texture("cursor"), 0, Game.mouseX, Game.mouseY, 2, 2, true);
        } else {
          drawTexture(assets.texture("cursor_no"), 0, Game.mouseX, Game.mouseY, 2, 2, true);
        }
      } else {
        drawTexture(assets.texture("cursor"), 0, Game.mouseX, Game.mouseY, 2, 2, true);
      }
    }

    // every 50 render frames, update FPS monitor
    c__ticks++;
    if (c__ticks%50 == 0) {
      const now = Date.now()
      const fps = Math.round(50000/(now - c__lastTime));
      DOMMonitor1.innerText = `${fps} FPS`;
      c__lastTime = now;
      c__ticks = 0;
    }
  }
  requestAnimationFrame(render);
}

// @game

const Game = {
  hoveredBlockX: 0,
  hoveredBlockY: 0,
  hoveredBlockXPrev: 0,
  hoveredBlockYPrev: 0,
  mouseX: 0,
  mouseY: 0,

  ticks: 0,
  time: 0,
  loadedEntities: [],
  player: {},
  dim: {},

  renderLeft: 0,
  renderRight: 0,
  renderDistance: 64,
  loadDistance: 64,

  guiMode: "hotbar",
  gui: [gui_hotbar],
  hoveredGUI: -1,
  hoveredSlot: null,
  grabbedItem: null,
  hotbarCursor: 0,
  wallMode: false,

  drawHitboxes: false,
  instabreak: false,
  lastTime: Date.now(),

  // returns the item the player is currently holding
  playerHeldItem: function() {
    return Game.player.inv.contents[Game.hotbarCursor];
  },

  // sets the current GUI the player is interacting with
  setGUIMode: function(m) {
    switch(m) {
      case "hotbar":
        Game.guiMode = m;
        Game.gui = [gui_hotbar];
        gui_hotbar.x = 8;
        gui_hotbar.y = 8;
      break;
      case "inventory_with_crafting":
        Game.guiMode = m;
        Game.gui = [gui_inventory_with_crafting];
        gui_inventory_with_crafting.x = 8;
        gui_inventory_with_crafting.y = 8;
      break;
      case "crafting_table":
        Game.guiMode = m;
        Game.gui = [gui_inventory, gui_crafting_table];
        gui_inventory.x = 8;
        gui_inventory.y = 8;
        gui_crafting_table.x = 230;
        gui_crafting_table.y = 8;
      break;
    }
    Game.updateGUICursor();
  },

  updateRenderBounds: function() {
    Game.renderLeft = Math.floor(Game.player.x/16) - Game.renderDistance;
    Game.renderRight = Game.renderLeft + Game.renderDistance*2;
    if (Game.renderLeft < 0) {
      Game.renderLeft = 0;
    }
    if (Game.renderRight > Game.dim.width) {
      Game.renderRight = Game.dim.width;
    }
  },
  loadEntities: function() {
    Game.loadedEntities = [];
    for (const i in Game.dim.entities) {
      if (Math.abs(Game.dim.entities[i].x - Game.player.x) <= Game.loadDistance*16) {
        Game.loadedEntities.push(Game.dim.entities[i]);
      }
    }
  },
  stackDrops: function() {
    let drops = [];
    for (const i in Game.loadedEntities) {
      if (Game.loadedEntities[i].species == assets.species("droppedItem")) {
        drops.push(Game.loadedEntities[i]);
      }
    }
    for (const i in drops) {
      if (!drops[i].dead) {
        for (const j in drops) {
          if (
            (i!=j) &&
            (Math.abs(drops[i].x - drops[j].x) <= 48) &&
            (Math.abs(drops[i].y - drops[j].y) <= 48) &&
            (drops[i].item.willStackWith(drops[j].item)) &&
            (!drops[j].dead)
          ) {
            drops[i].item.count += drops[j].item.count;
            drops[j].dead = true;
          }
        }
      }
    }
  },
  entityCollision: function(e1, e2) {
    const tlx1 = e1.x;
    const tly1 = e1.y + e1.species.hitboxHeight;
    const brx1 = e1.x + e1.species.hitboxWidth;
    const bry1 = e1.y;
    const tlx2 = e2.x;
    const tly2 = e2.y + e2.species.hitboxHeight;
    const brx2 = e2.x + e2.species.hitboxWidth;
    const bry2 = e2.y;

    let bool = (
      (tlx1 < brx2) &&
      (brx1 > tlx2) &&
      (tly1 > bry2) &&
      (bry1 < tly2)
    );

    return bool;
  },
  updateCursor: function() {
    const cx = gameX(Game.mouseX);
    const cy = gameY(Game.mouseY);
    let coords = Game.dim.blockCoordsAt(cx, cy);
    Game.hoveredBlockX = coords[0];
    Game.hoveredBlockY = coords[1];
    // if hovered block is changed
    /*
    if ((Game.hoveredBlockX!=Game.hoveredBlockXPrev)||(Game.hoveredBlockY!=Game.hoveredBlockYPrev)) {
      if (Game.player.breaking) {

      }
    }
    */
    Game.hoveredBlockXPrev = coords[0];
    Game.hoveredBlockYPrev = coords[1];
  },
  updateGUICursor: function() {
    // get hovered GUI
    let hoveredGUI = -1;
    for (const i in Game.gui) {
      if (
        (Game.mouseX > Game.gui[i].x*camera.guiScale) &&
        (Game.mouseY > Game.gui[i].y*camera.guiScale) &&
        (Game.mouseX < Game.gui[i].x*camera.guiScale + Game.gui[i].texture.width*camera.guiScale) &&
        (Game.mouseY < Game.gui[i].y*camera.guiScale + Game.gui[i].texture.height*camera.guiScale)
      ) {
        hoveredGUI = i;
        break;
      }
    }
    Game.hoveredGUI = hoveredGUI;

    // get hovered slot
    if (hoveredGUI != -1) {
      const gui = Game.gui[Game.hoveredGUI];
      let hoveredSlot = null;
      for (const i in gui.slotList) {
        if (
          (Game.mouseX > camera.guiScale*(gui.x + gui.slotList[i].x)) &&
          (Game.mouseX < camera.guiScale*(gui.x + 20 + gui.slotList[i].x)) &&
          (Game.mouseY > camera.guiScale*(gui.y + gui.slotList[i].y)) &&
          (Game.mouseY < camera.guiScale*(gui.y + 20 + gui.slotList[i].y))
        ) {
          hoveredSlot = gui.slotList[i];
          break;
        }
      }
      Game.hoveredSlot = hoveredSlot;
    } else {
      Game.hoveredSlot = null;
    }
  },
  // MAIN GAME LOOP
  loop: function() {
    if (Game.loadedEntities.length == 0) {
      Game.updateRenderBounds();
      Game.loadEntities();
    }
    // do logic for each loaded entity
    for (const i in Game.loadedEntities) {
      Game.loadedEntities[i].doLogic();
    }
    camera.loop();

    // kill dead entities
    let newEntities = [];
    let updateEntities = false;
    for (const i in Game.dim.entities) {
      if (!Game.dim.entities[i].dead) {
        newEntities.push(Game.dim.entities[i]);
      } else {
        updateEntities = true;
      }
    }
    Game.dim.entities = newEntities;
    if (updateEntities) {
      Game.loadEntities();
    }

    // every 50 ticks, update render bounds so only close blocks are rendered
    Game.ticks++;
    if (Game.ticks%50 == 0) {

      // also updates TPS monitor
      const now = Date.now()
      const tps = Math.round(50000/(now - Game.lastTime));
      DOMMonitor0.innerText = `${tps} TPS`;
      Game.lastTime = now;

      Game.updateRenderBounds();
    }

    // every 100 ticks, cache faraway entities so only close ones are loaded
    // also stacks dropped item entities
    if (Game.ticks >= 100) {
      Game.ticks = 0;
      Game.loadEntities();
      Game.stackDrops();
    }

  }
};

// CONTROLS

let controlScheme = [
  ["moveLeft","KeyA"],
  ["moveRight","KeyD"],
  ["jump","Space"],
  ["openInv","Escape"],
  ["wallMode","KeyE"]
];
let controlMap = new Map();
let keyMap = new Map();
for (const i in controlScheme) {
  controlMap.set(controlScheme[i][0], {name: controlScheme[i][0], key: controlScheme[i][1], state: false});
  keyMap.set(controlScheme[i][1], controlMap.get(controlScheme[i][0]));
}

document.addEventListener("keydown", function(e) {
  if (e.code == "Space") {e.preventDefault();}
  if (keyMap.get(e.code) != undefined) {
    keyMap.get(e.code).state = true;
  }
});
document.addEventListener("keyup", function(e) {
  if (keyMap.get(e.code) != undefined) {
    keyMap.get(e.code).state = false;
  }
});

// update cursor on mousemove
document.getElementById("GameContainer").addEventListener("mousemove", function(e) {
  Game.mouseX = e.clientX - DOMCanvas.getBoundingClientRect().left + window.scrollX;
  Game.mouseY = e.clientY - DOMCanvas.getBoundingClientRect().top + window.scrollY;
  Game.updateCursor();
  Game.updateGUICursor();
});

DOMCanvas.addEventListener("mousedown", function(e) {
  // LEFT CLICK
  if (e.button == 0) {
    if (Game.hoveredGUI == -1) {
      Game.player.swinging = true;
    } else {
      // LEFT CLICKED AN INVENTORY SLOT
      if (Game.hoveredSlot !== null) {
        // left clicked an item
        if (Game.hoveredSlot.getItem() !== null) {
          // left clicked an item while not holding an item
          // if taking from the craft result slot, reduce all crafting ingredients' count by 1
          if (Game.grabbedItem === null) {
            Game.grabbedItem = Game.hoveredSlot.getItem();
            Game.hoveredSlot.setItem(null);
            if (Game.hoveredSlot.referencedInv == Game.player.craftResultInv) {
              for (let i=0; i<9; i++) {
                Game.player.craftInv.reduce(i);
              }
            }
          }
          // left clicked an item while already holding an item
          else {
            // not the craft result slot
            if (Game.hoveredSlot.referencedInv != Game.player.craftResultInv) {
              if (Game.grabbedItem.willStackWith(Game.hoveredSlot.getItem())) {
                // items stack
                Game.hoveredSlot.getItem().count += Game.grabbedItem.count;
                Game.grabbedItem = null;
              } else {
                // items don't stack
                let temp = Game.grabbedItem;
                Game.grabbedItem = Game.hoveredSlot.getItem();
                Game.hoveredSlot.setItem(temp);
              }
            }
            // the craft result slot
            else {
              if (Game.grabbedItem.willStackWith(Game.hoveredSlot.getItem())) {
                // items stack
                Game.grabbedItem.count += Game.hoveredSlot.getItem().count;
                Game.player.craftResultInv.contents[0] = null;
                for (let i=0; i<9; i++) {
                  Game.player.craftInv.reduce(i);
                }
              }
            }
          }
        }
        // left clicked an empty slot
        else {
          // left clicked an empty slot while holding an item
          // fails on a take-only slot
          if (Game.grabbedItem !== null) {
            if (Game.hoveredSlot.referencedInv != Game.player.craftResultInv) {
              Game.hoveredSlot.setItem(Game.grabbedItem);
              Game.grabbedItem = null;
            }
          }
        }
        if ((Game.hoveredSlot.referencedInv == Game.player.craftInv) || (Game.hoveredSlot.referencedInv == Game.player.craftResultInv)) {
          recipes.tryCrafting();
        }
      }
    }
  }
  // RIGHT CLICK
  else if (e.button == 2) {
    if (Game.hoveredGUI == -1) {
      let doRightClickEvent = true;
      const heldItem = Game.playerHeldItem();
      // right click while holding something
      if (heldItem !== null) {
        // holding a block
        if (heldItem.itemType.category == ITEMCAT_BLOCK) {
          Game.player.placing = true;
        }
        // holding an item/tool
        else {
          heldItem.itemType.eventUse();
        }
      }
      // block right click event
      if ((Game.dim.tiles[Game.hoveredBlockX][Game.hoveredBlockY].block instanceof Block) && (doRightClickEvent)) {
        Game.dim.tiles[Game.hoveredBlockX][Game.hoveredBlockY].block.eventInteract(Game.hoveredBlockX, Game.hoveredBlockY);
      }
    } else {
      // RIGHT CLICKED AN INVENTORY SLOT  (fails on a take-only slot)
      if ((Game.hoveredSlot !== null)&&(Game.hoveredSlot.referencedInv != Game.player.craftResultInv)) {
        // right clicked an item
        if (Game.hoveredSlot.getItem() !== null) {
          // right clicked an item while not holding an item
          if (Game.grabbedItem === null) {
            if (Game.hoveredSlot.getItem().count > 1) {
              const newItemCount = Math.floor(Game.hoveredSlot.getItem().count/2);
              Game.grabbedItem = Game.hoveredSlot.getItem().copy();
              Game.hoveredSlot.getItem().count -= newItemCount;
              Game.grabbedItem.count = newItemCount;
            }
          }
          // right clicked an item while already holding an item
          else {
            if (Game.grabbedItem.willStackWith(Game.hoveredSlot.getItem())) {
              // items stack
              Game.hoveredSlot.getItem().count++;
              Game.grabbedItem.count--;
              if (Game.grabbedItem.count == 0) {
                Game.grabbedItem = null;
              }
            }
          }
        }
        // right clicked an empty slot
        else {
          // right clicked an empty slot while holding an item
          if (Game.grabbedItem !== null) {
            Game.hoveredSlot.setItem(Game.grabbedItem.copy());
            Game.hoveredSlot.getItem().count = 1;
            Game.grabbedItem.count--;
            if (Game.grabbedItem.count == 0) {
              Game.grabbedItem = null;
            }
          }
        }
        if (Game.hoveredSlot.referencedInv == Game.player.craftInv) {recipes.tryCrafting();}
      }
    }
  }
});

DOMCanvas.addEventListener("contextmenu", function(e) {
  e.preventDefault();
});

document.addEventListener("mouseup", function(e) {
  if (e.button == 0) {
    Game.player.swinging = false;
    Game.player.breaking = false;
  } else if (e.button == 2) {
    Game.player.placing = false;
  }
})

window.addEventListener("resize", camera.autoResize);
document.addEventListener("DOMContentLoaded", camera.autoResize);

// DEBUG & TESTING

for (let i=0; i<document.getElementsByClassName("debug-sub button").length; i++) {
  document.getElementsByClassName("debug-sub button")[i].addEventListener("click", function() {
    this.setAttribute("state", ((this.getAttribute("state")=="on")?("off"):("on")));
  });
}

document.addEventListener("keydown", function(e) {
  if (e.code == "Tab") {
    e.preventDefault();
    document.getElementById("Debug").style.display = ((document.getElementById("Debug").style.display == "none") ? ("block") : ("none"));
  }

  // if a number key is pressed, select an item in the hotbar
  if (e.code.substr(0,5) == "Digit") {
    let n = Number(e.code.charAt(5) - 1);
    if (n == -1) {n = 9;}
    Game.hotbarCursor = n;
  }
});

DOMSetting0.addEventListener("click", function() {
  Game.instabreak = !Game.instabreak;
});

DOMSetting1.addEventListener("click", function() {
  Game.drawHitboxes = !Game.drawHitboxes;
});

DOMSetting2.addEventListener("input", function() {
  camera.zoom = Number(this.value);
  document.getElementById("Setting2Label").innerHTML = floatString(camera.zoom);
});

DOMSetting3.addEventListener("input", function() {
  Game.renderDistance = Number(this.value);
  document.getElementById("Setting3Label").innerHTML = String(Game.renderDistance);
});
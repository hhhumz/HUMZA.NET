// @recipes
// RECIPES

class Recipe {
  constructor(properties) {
    this.size = properties.size; // 3: 3x3 recipe, 2: 2x2 recipe, 1: single item recipe, 0: shapeless recipe
    this.result = properties.result;
    this.resultCount = properties.resultCount;
    this.layout = properties.layout;
    switch(this.size) {
      case 1:
        this.layoutNormalized = [
          this.layout[0], null, null,
          null, null, null,
          null, null, null
        ];
      break;
      case 2:
        this.layoutNormalized = [
          this.layout[0], this.layout[1], null,
          this.layout[2], this.layout[3], null,
          null, null, null
        ];
      break;
      case 3:
        this.layoutNormalized = this.layout;
      break;
    }
  }

  // returns true if the given item matches a code in a recipe
  static itemMatchesRecipeCode(item, str) {
    if ((item === null)&&(str === null)) {return true;}
    if ((item === null)&&(str !== null)) {return false;}
    if ((item !== null)&&(str === null)) {return false;}
    if (str.substr(0, 6) == "block/") {
      const blockStr = str.substr(6, str.length-6);
      return (item.itemType == assets.itemType("block") && (item.block == assets.block(blockStr)));
    }
    // recipe code used for "any planks"
    else if (str == "#planks_any") {
      return (
        (item.itemType == assets.itemType("block") && (item.block == assets.block("planks_oak")))
      );
    } else {
      return (item.itemType == assets.itemType(str));
    }
  }

  static normalize(arr) {
    // if full array is empty, leave it unchanged
    if (
      (arr[0]===null)&&(arr[1]===null)&&(arr[2]===null)&&
      (arr[3]===null)&&(arr[4]===null)&&(arr[5]===null)&&
      (arr[6]===null)&&(arr[7]===null)&&(arr[8]===null)
    ) {
      return arr;
    }

    // if there is a full column of space on the left, shift the whole array left
    while ((arr[0]==null)&&(arr[3]==null)&&(arr[6]==null)) {
      arr = [
        arr[1], arr[2], null,
        arr[4], arr[5], null,
        arr[7], arr[8], null
      ];
    }

    // if there is a full row of space on the top, shift the whole array up
    while ((arr[0]==null)&&(arr[1]==null)&&(arr[2]==null)) {
      arr = [
        arr[3], arr[4], arr[5],
        arr[6], arr[7], arr[8],
        null, null, null
      ];
    }

    return arr;
  }

  // returns true if the array matches the normalized layout of this recipe
  matchesNormalized(arr) {
    let b = true;
    for (let i=0; i<arr.length; i++) {
      b = b && Recipe.itemMatchesRecipeCode(arr[i], this.layoutNormalized[i]);
    }
    return b;
  }

  //
  static itemFromCode(str) {
    let newItem;
    if (str.substr(0, 6) == "block/") {
      const blockStr = str.substr(6, str.length-6);
      newItem = new Item({itemType: "block", count: 1, block: assets.block(blockStr)})
    } else {
      newItem = new Item({itemType: str, count: 1})
    }
    return newItem;
  }

  // returns a new item corresponding to the result of this crafting recipe
  createResult() {
    let newItem;
    if (this.result.substr(0, 6) == "block/") {
      const blockStr = this.result.substr(6, this.result.length-6);
      newItem = new Item({itemType: "block", count: this.resultCount, block: assets.block(blockStr)})
    } else {
      newItem = new Item({itemType: this.result, count: this.resultCount})
    }
    return newItem;
  }
}

const recipes = {
  list: [],
  add: function(properties) {
    this.list.push(new Recipe(properties));
  },
  tryCrafting() {
    let normalizedArr = Recipe.normalize(Game.player.craftInv.contents);
    for (const i in this.list) {
      if (this.list[i].matchesNormalized(normalizedArr)) {
        Game.player.craftResultInv.contents[0] = this.list[i].createResult();
        return true;
      }
    }
    Game.player.craftResultInv.contents[0] = null;
    return false;
  }
};

recipes.add({
  size: 1,
  result: "block/planks_oak",
  resultCount: 4,
  layout: ["block/log_oak"]
});

recipes.add({
  size: 2,
  result: "block/crafting_table",
  resultCount: 1,
  layout: [
    "#planks_any", "#planks_any",
    "#planks_any", "#planks_any"
  ]
});

recipes.add({
  size: 2,
  result: "stick",
  resultCount: 4,
  layout: [
    "#planks_any", null,
    "#planks_any", null
  ]
});

recipes.add({
  size: 3,
  result: "oak_door",
  resultCount: 3,
  layout: [
    "block/planks_oak", "block/planks_oak", null,
    "block/planks_oak", "block/planks_oak", null,
    "block/planks_oak", "block/planks_oak", null
  ]
});

recipes.add({
  size: 3,
  result: "wooden_pickaxe",
  resultCount: 1,
  layout: [
    "#planks_any", "#planks_any", "#planks_any",
    null, "stick", null,
    null, "stick", null
  ]
});

recipes.add({
  size: 3,
  result: "wooden_axe",
  resultCount: 1,
  layout: [
    "#planks_any", "#planks_any", null,
    "#planks_any", "stick", null,
    null, "stick", null
  ]
});

recipes.add({
  size: 3,
  result: "wooden_axe",
  resultCount: 1,
  layout: [
    "#planks_any", "#planks_any", null,
    "stick", "#planks_any", null,
    "stick", null, null
  ]
});
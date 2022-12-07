const worldgen = {};

function testgen2(dim, params) {
  let c1 = params.stoneHt;
  let c1delta = 0;
  let c2 = params.dirtHt;
  let c2delta = 0;
  let treeCooldown = 0;

  for (let i=0; i<dim.width; i++) {

    // 30% chance to change delta
    if (Math.random()<0.3) {
      c1delta = randomRange(0, 2);
    }
    if (Math.random()<0.3) {
      c2delta = randomRange(0, 2);
    }

    // 50% chance to move cursor by delta
    if (Math.random()<0.5) {
      if (c1 > params.stoneHt+8) {
        c1 -= randomRange(0, c1delta);
      }
      else if (c1 < params.stoneHt-8) {
        c1 += randomRange(0, c1delta);
      }
      else {
        c1 += randomRange(-c1delta, c1delta);
      }
    }
    if (Math.random()<0.5) {
      if (c2 > params.dirtHt+3) {
        c2 -= randomRange(0, c2delta);
      }
      else if (c1 < params.dirtHt-3) {
        c2 += randomRange(0, c2delta);
      }
      else {
        c2 += randomRange(-c2delta, c2delta);
      }
    }

    // round cursors
    let c1round = Math.round(c1);
    let c2round = Math.round(c2);
    if (c2round < 2) {c2round = 2;}

    for (let j=0; j<c1round; j++) {
      dim.tiles[i][j].block = assets.block("stone");
    }
    for (let j=0; j<c2round; j++) {
      dim.tiles[i][c1round+j].block = assets.block("dirt");
    }
    dim.tiles[i][c1round+c2round].block = assets.block("grass");

    if (treeCooldown>0) {treeCooldown--;}

    // scuffed tree builder
    // 10% chance to generate trees, min. 5 blocks apart
    if ((i>5)&&(i<dim.width-5)&&(treeCooldown==0)) {
      if (Math.random()<0.1) {
        treeCooldown = 5;
        let trunkHeight = randomRangeInt(2,4);
        let leaves0 = randomRangeInt(0,1);
        let leaves1 = randomRangeInt(2,3);
        let leaves2 = randomRangeInt(1,2);
        let leaves3 = randomRangeInt(0,1);
        dim.tiles[i][c1round+c2round].block = assets.block("dirt");

        let treeCursor = c1round+c2round+1;
        for (let j=0; j<trunkHeight; j++) {
          dim.tiles[i][treeCursor+j].block = assets.block("log_oak");
        }
        treeCursor += trunkHeight;
        for (let j=0; j<leaves0; j++) {
          dim.tiles[i-1][treeCursor+j].block = assets.block("leaves_oak");
          dim.tiles[i]  [treeCursor+j].block = assets.block("leaves_oak");
          dim.tiles[i+1][treeCursor+j].block = assets.block("leaves_oak");
        }
        treeCursor += leaves0;
        for (let j=0; j<leaves1; j++) {
          dim.tiles[i-2][treeCursor+j].block = assets.block("leaves_oak");
          dim.tiles[i-1][treeCursor+j].block = assets.block("leaves_oak");
          dim.tiles[i]  [treeCursor+j].block = assets.block("leaves_oak");
          dim.tiles[i+1][treeCursor+j].block = assets.block("leaves_oak");
          dim.tiles[i+2][treeCursor+j].block = assets.block("leaves_oak");
        }
        treeCursor += leaves1;
        for (let j=0; j<leaves2; j++) {
          dim.tiles[i-1][treeCursor+j].block = assets.block("leaves_oak");
          dim.tiles[i]  [treeCursor+j].block = assets.block("leaves_oak");
          dim.tiles[i+1][treeCursor+j].block = assets.block("leaves_oak");
        }
        treeCursor += leaves2;
        for (let j=0; j<leaves3; j++) {
          dim.tiles[i]  [treeCursor+j].block = assets.block("leaves_oak");
        }
      }
    }
  }

  for (let i=0; i<dim.width; i++) {
    for (let j=0; j<params.stoneHt+3; j++) {
      if (
        (dim.tiles[i][j].block == assets.block("stone")) ||
        (dim.tiles[i][j].block == assets.block("dirt")) ||
        (dim.tiles[i][j].block == assets.block("grass"))
      ) {
        dim.tiles[i][j].wall = dim.tiles[i][j].block;
      }
    }
  }


}
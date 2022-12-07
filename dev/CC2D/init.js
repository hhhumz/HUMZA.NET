Game.player = new Entity(assets.species("player"), 0, 0);

Game.dim = new Dimension(512, 256, testgen2, {
  stoneHt: 64,
  dirtHt: 6,
  variance: 8
});

Game.loopID = setInterval(Game.loop, 16);
render();
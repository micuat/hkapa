function ColorScheme (colorString) {
  this.colors = [];
  {
    let cs = colorString.split("-");
    for(let i in cs) {
      let r = parseInt("0x"+cs[i].substring(0,2));
      let g = parseInt("0x"+cs[i].substring(2,4));
      let b = parseInt("0x"+cs[i].substring(4,6));
      this.colors.push({ r: r, g: g, b: b });
    }
  }
  this.offset = 0;
}

ColorScheme.prototype.shuffle = function () {
  // it's not really shuffle...
  this.offset = Math.floor(Math.random() * this.colors.length);
}

ColorScheme.prototype.startFrom = function (i) {
  this.offset = i;
}


ColorScheme.prototype.reset = function () {
  this.offset = 0;
}

ColorScheme.prototype.get = function (i) {
  i = Math.min(this.colors.length - 1, Math.max(0, i));
  return this.colors[(i + this.offset) % this.colors.length];
}
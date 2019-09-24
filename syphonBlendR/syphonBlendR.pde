import codeanticode.syphon.*;

SyphonClient client;

import deadpixel.keystone.*;

Keystone ks;
CornerPinSurface surface;

PImage img;
PShader cutoff;

void setup() {
  // Keystone will only work with P3D or OPENGL renderers, 
  // since it relies on texture mapping to deform
  //size(1280, 720, P3D);
  fullScreen(P3D, 1);
  client = new SyphonClient(this);

  ks = new Keystone(this);
  cutoff = loadShader("cutoff.glsl");
}

void draw() {
  if (client.newFrame()) {
    img = client.getImage(img); // load the pixels array with the updated image info (slow)
    int sw = img.width;
    int sh = img.height;
    float mult = 1920.0 / 1280.0;
    surface = ks.createCornerPinSurface(sw, sh, 20);
    surface.moveMeshPointBy(CornerPinSurface.TL, 0, 0);
    surface.moveMeshPointBy(CornerPinSurface.TL, -611*mult, 2*mult);

    surface.moveMeshPointBy(CornerPinSurface.TR, -sw, 0);
    surface.moveMeshPointBy(CornerPinSurface.TR, 1165*mult, 23*mult);

    surface.moveMeshPointBy(CornerPinSurface.BR, -sw, -sh);
    surface.moveMeshPointBy(CornerPinSurface.BR, 1168*mult, 669*mult);

    surface.moveMeshPointBy(CornerPinSurface.BL, 0, -sh);
    surface.moveMeshPointBy(CornerPinSurface.BL, -559*mult, 576*mult);

    background(0);

    translate(0, 44);
    surface.render(img);
    filter(cutoff);
  }
}

void keyPressed() {
  switch(key) {
  case 'c':
    // enter/leave calibration mode, where surfaces can be warped 
    // and moved
    ks.toggleCalibration();
    break;

  case 'l':
    // loads the saved layout
    ks.load();
    break;

  case 's':
    // saves the layout
    ks.save();
    break;
  }
}

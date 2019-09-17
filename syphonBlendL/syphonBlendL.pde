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
  fullScreen(P3D, 2);
  client = new SyphonClient(this);

  ks = new Keystone(this);
  cutoff = loadShader("cutoff.glsl");
}

void draw() {
  int sw = 1600;
  int sh = 600;
  surface = ks.createCornerPinSurface(sw, sh, 20);
  surface.moveMeshPointBy(CornerPinSurface.TL, 0, 0);
  surface.moveMeshPointBy(CornerPinSurface.TL, -4, -13);

  surface.moveMeshPointBy(CornerPinSurface.TR, -sw, 0);
  surface.moveMeshPointBy(CornerPinSurface.TR, 1741, 2);

  surface.moveMeshPointBy(CornerPinSurface.BR, -sw, -sh);
  surface.moveMeshPointBy(CornerPinSurface.BR, 1739, 548);

  surface.moveMeshPointBy(CornerPinSurface.BL, 0, -sh);
  surface.moveMeshPointBy(CornerPinSurface.BL, -3, 677);
  
  if (client.newFrame()) {
    img = client.getImage(img); // load the pixels array with the updated image info (slow)
  }
  if (img != null) {
    image(img, 0, 0, width, height);
  }

  background(0);

  surface.render(img);
  filter(cutoff);
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

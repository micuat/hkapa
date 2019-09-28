import codeanticode.syphon.*;

SyphonClient client;
PGraphics canvas;

void setup() {
  fullScreen(P3D, 2);
  client = new SyphonClient(this);
  background(0);
}

void draw() {
  if (client.newFrame()) {
    background(0);

    canvas = client.getGraphics(canvas);
    image(canvas, 0, 0, width, height);    
  }
}

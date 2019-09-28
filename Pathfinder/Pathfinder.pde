import processing.awt.PSurfaceAWT;
import peasy.*;
import java.util.*;
import toxi.geom.*;
import toxi.geom.mesh.subdiv.*;
import toxi.geom.mesh.*;
import toxi.processing.*;

import codeanticode.syphon.*;

float freqTarget = 0;
float freq = 0;
float volTarget = 0;
float vol = 0;
SyphonServer server;

PeasyCam cam;
BodyTransform transform;
Choreo choreo;

boolean runMultiScreen = false;
PGraphics contentGr;
PGraphics contentGr2D;

void setup() {
  setupTouchpad();

  //PSurfaceAWT awtSurface = (PSurfaceAWT)surface;
  //PSurfaceAWT.SmoothCanvas smoothCanvas = (PSurfaceAWT.SmoothCanvas)awtSurface.getNative();
  //smoothCanvas.getFrame().setAlwaysOnTop(true);
  //smoothCanvas.getFrame().removeNotify();
  //smoothCanvas.getFrame().setUndecorated(true);
  //smoothCanvas.getFrame().setLocation(0, 0);
  //smoothCanvas.getFrame().addNotify();
  size(1600, 550, P3D);
  //size(1200, 1200, P3D);
  //fullScreen(P3D, 2);
  smooth();
  server = new SyphonServer(this, "Processing Syphon");

  cam = new PeasyCam(this, 330);

  frameRate(29);                                      // set unlimited frame rate

  contentGr = createGraphics(width, height, P3D);
  contentGr2D = createGraphics(width, height);

  contentGr2D.beginDraw();
  contentGr2D.background(0);
  contentGr2D.endDraw();

  setupVisuals();
  setupGui();  
  setupBodyPrimitives();

  choreo = new Choreo(this);
  //start with choreo from body 0 to body 1
  transform = new BodyTransform(body[listofBody[0]], body[listofBody[1]]);

  item = new Item();
}

void draw() {
  //surface.setLocation(0, 0);

  updateFrame();

  drawFrame(contentGr);
  server.sendImage(contentGr);

  if (runMultiScreen) {
    contentGr.loadPixels(); 
    arrayCopy(contentGr.pixels, contentGr2D.pixels); 
    contentGr2D.updatePixels();
  }

  cam.beginHUD();
  image(contentGr, 0, 0);
  drawMenu();

  surface.setTitle("Morpher || " + int(frameRate) + " fps");

  cam.endHUD();

  
  if(choreo != null) {
    //float n = choreo.seq.getStepCount();
    //float s = choreo.seq.getSeek() * n;
    //s = s - floor(s);
    //volTarget = 1.0 - s;
    volTarget = 1.0 - choreo.seq.getSeek();
    vol = lerp(vol, volTarget, 0.05);
    
    float xPos = m.getCenter(transform.transformBody.element[0].mesh).x;
    
    OscMessage myMessage = new OscMessage("/control/a");
    freq = lerp(freq, freqTarget, 0.1);
    myMessage.add(freq);
    myMessage.add(vol);
    float rx = cp5WorldRangeX/4;
    myMessage.add(constrain(map(xPos, -rx, rx, -1, 1), -rx, rx));
    oscP5.send(myMessage, myRemoteLocation);
  }
}

void updateFrame() {
  choreo.update();
  updateVisuals();
}

void drawMenu() {
  if (isGuiDraw) drawHUD();
}

void drawFrame(PGraphics in) {
  in.beginDraw();
  in.setMatrix(getMatrix()); // replace the PGraphics-matrix
  in.colorMode(RGB);
  in.background(backgroundCol);
  in.colorMode(HSB, 360);
  in.scale(cp5WorldScale);
  in.translate(0, 0, -5);

  drawVisuals(in);
  in.endDraw();
}

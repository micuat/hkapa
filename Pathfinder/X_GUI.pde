import de.looksgood.ani.*;
import de.looksgood.ani.easing.*;

import controlP5.*;

int mode = 3;

boolean isGuiInit = false;
boolean isGuiDraw = true;

boolean drawPointVsLines = false;
float aniRot = 0;
float aniRotNo = 0;
float aniTransX = 0;
float aniTransY = 0;
float aniTransZ = 0;
float aniSizeX = 0;
float aniSizeY = 0;

int framePos = 0;

//Playback 0 = auto ; 1 = Loop ; 2 = Manual;
int cp5PlaybackStyle = 0;
float cp5SeekAniValue = 0;

boolean cp53DAnim = false;
boolean cp5QuantAnim = true;
boolean cp5Shuffle = false;

float cp5TransSpeed = 1.4;
float cp5TransDelay = 0.0;
float cp5TransSwing = 0.1;
float cp5TransMass = 0.1;

boolean cp5DisplayPoints = true;
boolean cp5DisplayLines = true;
boolean cp5DisplayPolygon = false;
boolean cp5DisplayNormals = false;
boolean cp5DisplayTrails = false;

boolean cp5DisplayLast = true;
boolean cp5DisplaySource = true;
boolean cp5DisplayDestiny = true;

float globalRotate = 0;

int     cp5WorldScale = 21;
float   cp5WorldSpeed = 0.6;
int     cp5WorldRangeY = 12;
int     cp5WorldRangeX = 24;
boolean cp5WorldOrigin = false;
boolean cp5WorldGrid = true;
boolean cp5WorldRoom = true;

boolean cp5UseCamera = false;

ControlP5 cp5;
int unitSpace = 25;

ScrollableList[] objectGui;
ScrollableList d1;
RadioButton r;

void setupGui() {
  cp5 = new ControlP5(this);
  // https://github.com/sojamo/controlp5/issues/29
  cp5.getProperties().setFormat(ControlP5.SERIALIZED);

  cp5.setColorBackground(color(40));
  cp5.setColorForeground(color(130));
  cp5.setColorActive(color(155)); 

  cp5.setAutoDraw(false);

  ControlGroup cg = cp5.addGroup("Animation", width - 275 * 2 - 50, (int)(unitSpace * 1.5));
  cp5.begin(cg, 0, unitSpace);
  cp5.addToggle("cp53DAnim").setLabel("3D");
  cp5.addToggle("cp5QuantAnim").setLabel("Quant");
  cp5.addToggle("cp5Shuffle").setLabel("Shuffle Choreo");

  r = cp5.addRadioButton("radioButton")
    .setPosition(unitSpace, unitSpace)
    .setSize(25, 15)
    .setItemsPerRow(3)
    .setSpacingColumn(125)
    .addItem("Auto", 1)
    // .addItem("Loop", 2)
    // .addItem("Manual", 3)
    .setColorActive(highlight1)
    ;
  r.activate(0);

  cp5.addSlider("cp5TransSpeed", 0.1, 8).linebreak().setLabel("Speed").setPosition(0, unitSpace * 3);
  cp5.addSlider("cp5TransDelay", 0, 5).linebreak().setLabel("Delay").setPosition(0, unitSpace * 4);
  cp5.addSlider("cp5TransSwing", 0.01, 0.999).linebreak().setLabel("Swing").setPosition(0, unitSpace * 5);
  cp5.addSlider("cp5TransMass", 0.01, 1).linebreak().setLabel("Mass").setPosition(0, unitSpace * 6);

  d1 = cp5.addScrollableList("Easing").setPosition(150, unitSpace * 4 - 10);
  customize(d1); // customize the first list
  d1.setGroup(cg);
  cp5.end();

  ControlGroup cd = cp5.addGroup("Display", width - 275 * 2 - 50, (int)(unitSpace * 15));//unitSpace * 10);
  cp5.begin(cd, 0, unitSpace);
  cp5.addToggle("cp5DisplayPolygon").setLabel("Polygon");
  cp5.addToggle("cp5DisplayPoints").setLabel("Points");
  cp5.addToggle("cp5DisplayLines").setLabel("Lines");
  cp5.addToggle("cp5DisplayNormals").setLabel("Normals");  
  cp5.addToggle("enterRecording").setLabel("DTrails");  
  cp5.addToggle("cp5DisplayTrails").setLabel("ITrails").linebreak();
  cp5.addToggle("cp5DisplayLast").setLabel("Show Last").linebreak();
  cp5.addToggle("cp5DisplaySource").setLabel("Show Source").linebreak();
  cp5.addToggle("cp5DisplayDestiny").setLabel("Show Destiny");
  cp5.end();

  ControlGroup cw = cp5.addGroup("World", width - 275, (int)(unitSpace * 1.5)); //unitSpace * 20);
  cp5.begin(cw, 0, unitSpace);
  cp5.addSlider("cp5WorldRangeX", 1, 20).linebreak().setLabel("RangeX").linebreak();
  cp5.addSlider("cp5WorldRangeY", 1, 20).linebreak().setLabel("RangeY").linebreak();
  cp5.addSlider("cp5WorldSpeed", 0, 2).linebreak().setLabel("Rotate Speed").linebreak();
  cp5.addSlider("cp5WorldScale", 1, 50).linebreak().setLabel("Scale").linebreak();
  cp5.addToggle("cp5WorldOrigin").setLabel("Origin");
  cp5.addToggle("cp5WorldGrid").setLabel("Grid");
  cp5.addToggle("cp5WorldRoom").setLabel("Room");
  cp5.addButton("cp5Save").setLabel("Save").setPosition(0, unitSpace*10).setId(101);
  cp5.addButton("cp5Load").setLabel("Load").setPosition(100, unitSpace*10).setId(100);
  cp5.end();

  setupObjectGui();
}


void setupObjectGui() {
  objectGui = new ScrollableList[listofBody.length];
  for (int i = 0; i < objectGui.length; i++)
    customizeObjects(i);

  isGuiInit = true;
}

void drawGui() {
  pushStyle();
  noStroke();
  fill(160, 40);
  rect(width - 300, 0, 300, height);
  cp5.draw(); 

  if (mouseX > width - 300) {
    cam.setMouseControlled(false);  //PeasyCam off
  } else
    cam.setMouseControlled(true);
  popStyle();

  updateObjectGUI();
}

void customize(ScrollableList ddl) {
  // a convenience function to customize a DropdownList
  ddl.setBackgroundColor(color(190));
  ddl.setItemHeight(20);
  ddl.setBarHeight(15);
  ddl.setType(ScrollableList.LIST); // or DROPDOWN
  ddl.getCaptionLabel().set("easing");
  ddl.getCaptionLabel().getStyle().marginTop = 3;
  ddl.getCaptionLabel().getStyle().marginLeft = 3;
  ddl.getValueLabel().getStyle().marginTop = 3;
  for (int i = 0; i < easingsVariableNames.length; i++) {
    ddl.addItem(easingsVariableNames[i], i);
  }
  ddl.setColorBackground(color(60));
  ddl.setColorActive(color(255, 128));
}

void customizeObjects( int num) {  
  int num2 = num + 1;
  objectGui[num] = cp5.addScrollableList("object_" + num2).setPosition(unitSpace + ((num) * 150), unitSpace * 3);
  // a convenience function to customize a DropdownList
  objectGui[num].setBackgroundColor(color(190));
  objectGui[num].setItemHeight(20);
  objectGui[num].setBarHeight(15);
  objectGui[num].setSize(100, 500);
  objectGui[num].setType(ScrollableList.LIST); // or DROPDOWN
  objectGui[num].getCaptionLabel().getStyle().marginTop = 3;
  objectGui[num].getCaptionLabel().getStyle().marginLeft = 3;
  objectGui[num].getValueLabel().getStyle().marginTop = 3;
  for (int i=0; i<nameofBody.length; i++) {
    objectGui[num].addItem(nameofBody[i], i);
  }
  //ddl.scroll(0);
  objectGui[num].setColorBackground(color(60));
  objectGui[num].setColorActive(color(255, 128));
}

void updateObjectGUI() {
  if(choreo != null) {
    d1.setValue(choreo.easingType);
  }
  for (int i = 0; i < objectGui.length; i++) {

    if (objectGui[i] != null) {
      String y = int(i + 1) + "";
      // objectGui[i].getCaptionLabel().set(y + "_" + nameofBody[listofBody[i]]);
      if (i == indexCurTarget)
        objectGui[i].setColorBackground(highlight1);
      else
        objectGui[i].setColorBackground(color(60));

      objectGui[i].setValue(listofBody[i]);

      if (i == (indexCurTarget - 1) % objectGui.length) objectGui[i].setColorBackground(color(155));
    }
  }
}

void controlEvent(ControlEvent theEvent) {
  if (theEvent.isFrom(r)) {
    cp5PlaybackStyle = int(theEvent.group().getValue());
    choreo.changePlayback();

    return;
  }

  if (theEvent.getId() == 100) selectInput("load settings", "fileLoadCP5");
  if (theEvent.getId() == 101) {
    selectInput("save settings", "fileSaveCP5");
  }

  if (theEvent.getName().equals("enterRecording")) {
    item.clear();
  }
  if (theEvent.isController()) {
    // check if the Event was triggered from a ControlGroup
    // println("event from group : " + theEvent.getGroup().getValue() + " from " + theEvent.getGroup());

    String name = "" + theEvent.getName();

    println(name);
    if ("Easing".equals(name)) {
      choreo.easingType = (int)theEvent.getValue();
      println("yeeeeeeeeeeees");
    }

    if ("object_1".equals(name))
      listofBody[0] = (int)theEvent.getValue();

    if ("object_2".equals(name))
      listofBody[1] = (int)theEvent.getValue();

    if ("object_3".equals(name)) {
      listofBody[2] = (int)theEvent.getValue();
    }

    if ("object_4".equals(name))
      listofBody[3] = (int)theEvent.getValue();

    if ("object_5".equals(name))
      listofBody[4] = (int)theEvent.getValue();

    if ("object_6".equals(name))
      listofBody[5] = (int)theEvent.getValue();

    if ("object_7".equals(name))
      listofBody[6] = (int)theEvent.getValue();

    if ("object_8".equals(name))
      listofBody[7] = (int)theEvent.getValue();
    println(listofBody);
  }
}

void keyReleased() {

  if (key == CODED) {
    if (keyCode == LEFT) {
      if (framePos == 0)
        framePos = 1920;
      else
        framePos = 0;
    } else if (keyCode == RIGHT) {
      if (framePos == 0)
        framePos = 1920;
      else
        framePos = 0;
    }
  } 

  switch(key) {

  case '0' : 
    randObj();
    break;  

  case '1' : 
    pointPoint();
    break;  

  case '2' : 
    lineLine();
    break;  

  case '3' : 
    planePlane();
    break;   

  case '4' : 
    pointLine();
    break;

  case '5' : 
    pointPlane();
    break;

  case '6' : 
    linePlane();
    break;     

  case 'n' : 
    choreo.jumpNextTarget();
    break;

  case 'g' :
    isGuiDraw = !isGuiDraw;
    break; 

  case 'r' : 
    // enterRecording = !enterRecording; 
    item.clear();
    break;

  case 'c' : 
    globalRotate = 0;
    break;

  case 'd' : 
    drawDebug = !drawDebug;
    break;

  case 'w' :
    item.writeToFile();  
    break;

  case 's' : 
    choreo.setupAni();  
    break;

  case 'l' : 
    drawPointVsLines = !drawPointVsLines;
    break;
  }
}

void pointPoint() {
  for (int i = 0; i < listofBody.length; i++)
    listofBody[i] = 0;
}

void lineLine() {
  for (int i = 0; i < listofBody.length; i++)
    listofBody[i] = 1;
}

void planePlane() {
  for (int i = 0; i < listofBody.length; i++)
    listofBody[i] = (i % 2) + 2;
}

void pointLine() {
  listofBody[0] = 0;
  listofBody[1] = 1;
  listofBody[2] = 0;
  listofBody[3] = 1;
  listofBody[4] = 0;
}

void pointPlane() {
  for (int i = 0; i < listofBody.length; i++)
    listofBody[i] = (i % 2) < 1 ? 0 : 2;
}

void linePlane() {
  for (int i = 0; i < listofBody.length; i++)
    listofBody[i] = (i % 2) < 1 ? 1 : 2;
}

void randObj() {
  for (int i = 0; i < listofBody.length; i++)
    listofBody[i] = (int)random(body.length);
}

void planeBox() {
  for (int i = 0; i < listofBody.length; i++)
    listofBody[i] = (i % 3) + 2;
}

void fileLoadCP5(File selection)
{ 
  String initStringLoadCP5 = selection.getAbsolutePath();
  println(initStringLoadCP5);
  try {
    cp5.loadProperties(initStringLoadCP5);
  } catch (Exception e) {
    e.printStackTrace();
  }
  println(objectGui[0].getValue());
}

void fileSaveCP5(File selection)
{ 
  String initStringLoadCP5 = selection.getAbsolutePath();
  cp5.saveProperties(initStringLoadCP5);
}

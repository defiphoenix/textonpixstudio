export type Position =
  | "top-left"
  | "top-center"
  | "top-right"
  | "center-left"
  | "center"
  | "center-right"
  | "bottom-left"
  | "bottom-center"
  | "bottom-right";

export type Distribution = "sequential" | "random" | "repeat" | "generate";

export type BackgroundMode = "none" | "solid" | "translucent";

export type DesignSettings = {
  fontFamily: string;
  autoFit: boolean;
  fontSize: number;
  position: Position;
  align: "left" | "center" | "right";
  color: string;
  opacity: number;
  bold: boolean;
  italic: boolean;
  letterSpacing: number;
  lineHeight: number;
  shadow: boolean;
  shadowBlur: number;
  shadowOpacity: number;
  shadowOffset: number;
  outline: boolean;
  outlineWidth: number;
  outlineColor: string;
  background: BackgroundMode;
  backgroundColor: string;
  backgroundOpacity: number;
  backgroundRadius: number;
  backgroundPadding: number;
};

export type UploadedImage = {
  id: string;
  file: File;
  name: string;
  size: number;
  previewUrl: string;
  width: number;
  height: number;
};

export type TextItem = { id: string; text: string };

export type GeneratedImage = {
  id: string;
  imageId: string;
  name: string;
  text: string;
  url: string;
};

export type FailedImage = { id: string; name: string; reason: string };

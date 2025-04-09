
import { messageClient } from "@/common/utils/client";
import { SelectionInfo } from "client-core";

export const selectionCallback = (info: SelectionInfo) => {
  console.log('Selection changed:', info);
  messageClient.postMessage('C2W-SelectionChanged', info);
};
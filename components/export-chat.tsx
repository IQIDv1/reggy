// "use client";

// import { useState } from "react";
// import { Button } from "@/components/ui/button";
// import { Download } from "lucide-react";
// import type { ChatMessage } from "@/lib/types";

// type ExportChatProps = {
//   messages: ChatMessage[];
//   sessionTitle: string;
// };

// export function ExportChat({ messages, sessionTitle }: ExportChatProps) {
//   const [isExporting, setIsExporting] = useState(false);

//   const exportChat = async () => {
//     setIsExporting(true);
//     try {
//       const chatContent = messages
//         .map((msg) => `${msg.role}: ${msg.content}`)
//         .join("\n\n");
//       const blob = new Blob([chatContent], { type: "text/plain" });
//       const url = URL.createObjectURL(blob);
//       const a = document.createElement("a");
//       a.href = url;
//       a.download = `${sessionTitle.replace(/\s+/g, "_")}_chat_export.txt`;
//       document.body.appendChild(a);
//       a.click();
//       document.body.removeChild(a);
//       URL.revokeObjectURL(url);
//     } catch (error) {
//       console.error("Error exporting chat:", error);
//     } finally {
//       setIsExporting(false);
//     }
//   };

//   return (
//     <Button
//       onClick={exportChat}
//       disabled={isExporting}
//       variant="outline"
//       size="sm"
//     >
//       {isExporting ? (
//         "Exporting..."
//       ) : (
//         <>
//           <Download className="mr-2 h-4 w-4" />
//           Export Chat
//         </>
//       )}
//     </Button>
//   );
// }

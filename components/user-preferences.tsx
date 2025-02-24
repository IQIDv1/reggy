// "use client";

// import { useState, useEffect } from "react";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";
// import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
// import type { Database } from "@/lib/database.types";
// import { Profile } from "@/lib/types";
// import { getCurrentAcademicYear } from "@/lib/utils";

// type UserPreferences = {
//   defaultAcademicYear: string;
//   citationStyle: "APA" | "MLA" | "Chicago";
// };

// export function UserPreferences() {
//   const [preferences, setPreferences] = useState<UserPreferences>({
//     defaultAcademicYear: getCurrentAcademicYear(),
//     citationStyle: "APA",
//   });
//   const [isSaving, setIsSaving] = useState(false);
//   const supabase = createClientComponentClient<Database>();

//   useEffect(() => {
//     fetchPreferences();
//   }, []);

//   const fetchPreferences = async () => {
//     const {
//       data: { session },
//     } = await supabase.auth.getSession();

//     if (session) {
//       const { data, error } = await supabase
//         .from("profiles")
//         .select("preferences")
//         .eq("id", session.user.id)
//         .returns<Profile[]>()
//         .single();

//       if (error) {
//         console.error("Error fetching preferences:", error);
//       } else if (data?.preferences) {
//         setPreferences(data.preferences);
//       }
//     }
//   };

//   const savePreferences = async () => {
//     setIsSaving(true);
//     const {
//       data: { session },
//     } = await supabase.auth.getSession();
//     if (session) {
//       const { error } = await supabase
//         .from("profiles")
//         .update({ preferences })
//         .eq("id", session.user.id);

//       if (error) {
//         console.error("Error saving preferences:", error);
//       }
//     }
//     setIsSaving(false);
//   };

//   return (
//     <div className="space-y-4">
//       <div>
//         <Label htmlFor="defaultAcademicYear">Default Academic Year</Label>
//         <Input
//           id="defaultAcademicYear"
//           value={preferences.defaultAcademicYear}
//           onChange={(e) =>
//             setPreferences({
//               ...preferences,
//               defaultAcademicYear: e.target.value,
//             })
//           }
//         />
//       </div>
//       <div>
//         <Label htmlFor="citationStyle">Citation Style</Label>
//         <Select
//           value={preferences.citationStyle}
//           onValueChange={(value: "APA" | "MLA" | "Chicago") =>
//             setPreferences({ ...preferences, citationStyle: value })
//           }
//         >
//           <SelectTrigger id="citationStyle">
//             <SelectValue placeholder="Select citation style" />
//           </SelectTrigger>
//           <SelectContent>
//             <SelectItem value="APA">APA</SelectItem>
//             <SelectItem value="MLA">MLA</SelectItem>
//             <SelectItem value="Chicago">Chicago</SelectItem>
//           </SelectContent>
//         </Select>
//       </div>
//       <Button onClick={savePreferences} disabled={isSaving}>
//         {isSaving ? "Saving..." : "Save Preferences"}
//       </Button>
//     </div>
//   );
// }

import { createContext, useContext } from "react";

export const StudentAuthContext = createContext(null);

export function useStudentAuth() {
  const context = useContext(StudentAuthContext);
  if (!context) {
    throw new Error("useStudentAuth must be used inside StudentAuthProvider");
  }
  return context;
}

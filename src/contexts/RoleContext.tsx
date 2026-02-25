import React, { createContext, useContext, useState } from "react";
import { Role } from "@/data/sampleData";

interface RoleContextType {
  role: Role;
  setRole: (role: Role) => void;
}

const RoleContext = createContext<RoleContextType>({ role: "Admin", setRole: () => {} });

export const useRole = () => useContext(RoleContext);

export const RoleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [role, setRole] = useState<Role>("Admin");
  return <RoleContext.Provider value={{ role, setRole }}>{children}</RoleContext.Provider>;
};

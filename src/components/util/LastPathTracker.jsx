import { useAuth } from "@/contexts/app.context";
import React, { useEffect } from "react";
import { useLocation } from "react-router";

const LastPathTracker = () => {
  const { setLastPath } = useAuth();

  const location = useLocation();

  useEffect(()=>{
    setLastPath(location.pathname)
  },[location,setLastPath])

  return null;
};

export default LastPathTracker;

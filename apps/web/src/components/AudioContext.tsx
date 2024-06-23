import React, { createContext, useState } from 'react';

export const AudioContext = createContext<{
    playerEpisodeId: string | undefined;
    setPlayerEpisodeId: React.Dispatch<React.SetStateAction<string | undefined>>;
  }>({playerEpisodeId:undefined, setPlayerEpisodeId:()=>{}});

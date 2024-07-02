"use client";

import { Id } from "@packages/backend/convex/_generated/dataModel";
import { api } from '@packages/backend/convex/_generated/api';
import { useQuery,  } from 'convex/react';
import { Episode } from './Episode';

export const EpisodeById = function EpisodeById({ episode_id }: { episode_id: Id<"episode"> }): JSX.Element {
    const episode = useQuery(api.everwhz.episode, { id: (episode_id) });
    
    if(episode){
        return <Episode episode={episode}/>
    }else{
        return <>no episode found</>
    }
}
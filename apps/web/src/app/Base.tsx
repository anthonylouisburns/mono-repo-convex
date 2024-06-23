'use client';

import {
    Authenticated,
    Unauthenticated,
} from "convex/react";
import { AudioContext } from '@/components/AudioContext'
import { useState } from "react";


export default function Base({
    children,
}: {
    children: React.ReactNode;
}) {
    const [player_episode_id, set_player_episode_id] = useState<string>()
    return (
        <html lang='en'>
            <body>
                <Authenticated>
                    <AudioContext.Provider value={{ playerEpisodeId: player_episode_id, setPlayerEpisodeId: set_player_episode_id }}>
                        {children}
                    </AudioContext.Provider>
                </Authenticated>
                <Unauthenticated>
                    <div>
                        <h1 className="header-center rainbow-text">
                            Explore Historical Podcasts, login above
                        </h1>
                    </div>
                </Unauthenticated>
            </body>
        </html>
    );
}
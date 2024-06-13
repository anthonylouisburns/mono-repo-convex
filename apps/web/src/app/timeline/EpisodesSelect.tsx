"use client";

import { Doc, Id } from "@packages/backend/convex/_generated/dataModel";
import { Options } from "distinct-colors"
import distinctColors from "distinct-colors"
import { api } from '@packages/backend/convex/_generated/api';
import { useQuery, useMutation } from 'convex/react';
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import Select from 'react-select'

export const EpisodeSelect = function EpisodeSelect({ podcast_id, setSelectedEpisode }: { podcast_id: Id<"podcast"> | null, setSelectedEpisode: Dispatch<SetStateAction<Id<"episode">|null>> }): JSX.Element {
    const episodes = useQuery(api.everwzh.episodes, { podcast_id: (podcast_id) });

    //   const [optionData, setOptionData] = useState<Array<{label:string}>>([]);

    var optionList: Array<{ label: string, value: string }> = episodes ? episodes?.map((episode) => {
        return { label: (episode.body.title as string), value: (episode._id) }
    }) : []

    return <Select
        options={optionList}
        onChange={(e) => setSelectedEpisode(e?.value as Id<"episode">)}
        formatOptionLabel={function (data) {
            return (
                <span dangerouslySetInnerHTML={{ __html: data.label }} />
            );
        }} />
}


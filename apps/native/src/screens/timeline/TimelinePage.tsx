import React from 'react';
// import { useState } from "react";
import { View, ScrollView } from "react-native";
import { styles } from "../../component/Styles";
import { EverwhzHeader } from '../../component/EverwhzHeader';
import TimelineLevel1 from './TimelineLevel1';

export const getPageSize = (pageSize: Array<number>) => {
  return pageSize.reduce((acc, curr) => acc * curr, 1);
}

export default function TimelinePage({ route, navigation }) {
  const selectedOffset = route.params?.selectedOffset ?? -1;
  const pageInfo = [
    { pageSize: 5, color: ["#D1FAE5", "#ECFDF5"] },
    { pageSize: 8, color: ["#ECFCCB", "#F7FEE7"] },
    { pageSize: 8, color: ["#FFE4E6", "#FFF1F2"] },
    { pageSize: 12, color: ["#E0F2FE", "#F0F9FF"] },
    { pageSize: 1, color: ["#F5F5F4", "#FAFAF9"] }]
  return (
    <View style={styles.container}>
      <EverwhzHeader navigation={navigation} page="timeline" />
      <ScrollView>
        <TimelineLevel1  pageInfo={pageInfo} selectedOffset={Number(selectedOffset)} />
      </ScrollView>
    </View>
  );
}
// [x] scroll
// [x] colors
// [ ] collapse others
  export const formatCurrency = (value: number, isUsd: string = '$') => {
    if (value >= 1000000000) {
      return `${isUsd}${(value / 1000000000).toFixed(1)}B`;
    } else if (value >= 1000000) {
      return `${isUsd}${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `${isUsd}${(value / 1000).toFixed(1)}K`;
    } else {
      return `${isUsd}${value.toFixed(0)}`;
    }
  };
export type ItemCategoriesRes = {
  list: ItemCategoriesList[];
};
export type ItemCategoriesList = {
  _id: number;
  path: number[];
  parent_id: number;
  txt: {
    title: {
      ko: string;
    };
    desc: {
      ko: string;
    };
  };
  option: {
    title: string;
    parent: string;
    depth: number;
  };
  stat: {
    created: number;
    updated: number;
  };
};

export type ItemCategoryPrams = {
  depth: number;
  parent_id: number;
};

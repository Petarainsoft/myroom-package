import useCommentAPI from "@/apis/Social/Comment";
import React, { useCallback, useMemo } from "react";
import { useInView } from "react-intersection-observer";


const useComment = (targetId: string) => {
  const { fetchComments, refreshComments } = useCommentAPI();
  const { ref: inViewRef, inView } = useInView();
  
  //1차 댓글 리스트
  const { data, isLoading, fetchNextPage } = fetchComments({
      target_id: targetId,
      order: 'desc',
      limit: 15,
      orderby: 'recent',
  });

  const handleClickRefresh = useCallback(async()=>{
    refreshComments(targetId);
  }, [refreshComments, targetId]);

  const totalCount = useMemo(() => {
    return data?.pages && data?.pages.length > 0 && data?.pages[0]?.count?.total? data?.pages[0]?.count?.total : 0;
  }, [data, targetId]);
    


  React.useEffect(() => { 
    if (inView) {
      fetchNextPage();
    }
   
  }, [inView]);
  
  return {data, totalCount, inViewRef, isLoading, handleClickRefresh}
}

export default useComment;
import styled from 'styled-components';
import PingsCell from '@/pages/_shared/ui/FeedUIs/PingsCell';
const PingsList = () => {
  return (
    <Wrapper>
      <PingsCell />
      <PingsCell />
      <PingsCell />
      <PingsCell />
      <PingsCell />
    </Wrapper>
  );
};
const Wrapper = styled.div`
  width: 100%;
  padding: 0px;
  display: grid;
  justify-content: space-between;
  grid-template-columns: repeat(3, 1fr);
  grid-gap: 2px;
`;
export default PingsList;

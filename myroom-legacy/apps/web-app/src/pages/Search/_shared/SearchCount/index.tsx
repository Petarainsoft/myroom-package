import styles from './styles.module.scss';
import Text from '@/components/Text';

type SearchCountProps = {
    count: number;
}

const SearchCount = ({ count }: SearchCountProps) => {
    return <div className={styles['wrap']}>
        <Text locale={{ textId: "GCM.000014", values: {0: count} }} hasTag/>
    </div>
}

export default SearchCount
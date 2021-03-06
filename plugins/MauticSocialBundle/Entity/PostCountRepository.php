<?php
/**
 * @package     Mautic
 * @copyright   2016 Mautic, Inc. All rights reserved
 * @author      Mautic, Inc
 * @link        https://mautic.org
 * @license     GNU/GPLv3 http://www.gnu.org/licenses/gpl-3.0.html
 */

namespace MauticPlugin\MauticSocialBundle\Entity;

use Doctrine\ORM\Tools\Pagination\Paginator;
use Mautic\CoreBundle\Entity\CommonRepository;
use Mautic\CoreBundle\Helper\GraphHelper;

class PostCountRepository extends CommonRepository
{
    /**
     * Get a list of entities
     *
     * @param array      $args
     * @return Paginator
     */
    public function getEntities($args = array())
    {
        return parent::getEntities($args);
    }

    /**
     * Fetch Lead stats for some period of time.
     *
     * @param integer $quantity of units
     * @param string $unit of time php.net/manual/en/class.dateinterval.php#dateinterval.props
     * @param array $options
     *
     * @return mixed
     * @throws \Doctrine\ORM\NoResultException
     * @throws \Doctrine\ORM\NonUniqueResultException
     */
    public function getLeadStatsPost($quantity, $unit, $options)
    {
        $graphData = GraphHelper::prepareDatetimeLineGraphData($quantity, $unit, array('viewed'));

        // Load points for selected period
        $q = $this->_em->getConnection()->createQueryBuilder();
        $q->select('cl.post_count, cl.post_date')
            ->from(MAUTIC_TABLE_PREFIX.'monitor_post_count', 'cl');

        $utc = new \DateTimeZone('UTC');
        $graphData['fromDate']->setTimezone($utc);

        $q->setParameter('post_date', $graphData['fromDate']->format('Y-m-d'))
            // ->setParameter('false', false, 'boolean')
            ->orderBy('cl.post_date', 'ASC');


        if (isset($options['monitor_id'])) {
            $q->andwhere($q->expr()->eq('cl.monitor_id', (int) $options['monitor_id']));
        }

        $postCount = $q->execute()->fetchAll();

        return GraphHelper::mergeLineGraphData($graphData, $postCount, $unit, 0, 'post_date', 'post_count');
    }
}
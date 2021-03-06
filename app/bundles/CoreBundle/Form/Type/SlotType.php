<?php
/**
 * @package     Mautic
 * @copyright   2014 Mautic Contributors. All rights reserved.
 * @author      Mautic
 * @link        http://mautic.org
 * @license     GNU/GPLv3 http://www.gnu.org/licenses/gpl-3.0.html
 */

namespace Mautic\CoreBundle\Form\Type;

use Mautic\CoreBundle\Factory\MauticFactory;
use Symfony\Component\Form\AbstractType;
use Symfony\Component\Form\FormBuilderInterface;

/**
 * Class SlotType
 *
 * @package Mautic\CoreBundle\Form\Type
 */
class SlotType extends AbstractType
{

    private $factory;

    /**
     * @param MauticFactory $factory
     */
    public function __construct(MauticFactory $factory)
    {
        $this->factory = $factory;
    }

    /**
     * @param FormBuilderInterface $builder
     * @param array                $options
     */
    public function buildForm(FormBuilderInterface $builder, array $options)
    {
        $builder->add('delete', 'button', array(
            'attr'       => array(
                'class'           => 'btn btn-primary btn-xs pull-right btn-danger delete-slot',
            ),
        ));

        $builder->add('padding-top', 'number', array(
            'label'      => 'mautic.core.padding.top',
            'label_attr' => array('class' => 'control-label'),
            'required'   => false,
            'attr'       => array(
                'class'           => 'form-control',
                'data-slot-param' => 'padding-top',
                'postaddon_text'  => 'px',
            ),
        ));

        $builder->add('padding-bottom', 'number', array(
            'label'      => 'mautic.core.padding.bottom',
            'label_attr' => array('class' => 'control-label'),
            'required'   => false,
            'attr'       => array(
                'class'           => 'form-control',
                'data-slot-param' => 'padding-bottom',
                'postaddon_text'  => 'px',
            ),
        ));
    }

    /**
     * @return string
     */
    public function getName()
    {
        return "slot";
    }
}
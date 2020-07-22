/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
const { __ } = wp.i18n;
const { useRef } = wp.element;
const {
	InnerBlocks,
	BlockControls,
	InspectorControls
} = wp.blockEditor;
const {
	PanelBody,
	Toolbar,
	ToolbarButton,
	ToolbarGroup,
	RangeControl
} = wp.components;
const { withSelect } = wp.data;
const { compose } = wp.compose;

const TEMPLATE = [
	['mp-megamenu/plain-menu-item', {}],
];
const ALLOWED_BLOCKS = [
	'mp-megamenu/plain-menu-item',
];

function PlainMenu( args ) {
	const {
		selectedBlockHasDescendants,
		isImmediateParentOfSelectedBlock,
		isSelected,
		setAttributes,
		className,
		attributes
	} = args;

	const ref = useRef();

	function setAlignment(alignment) {
		return () => {
			const itemsJustification =
				attributes.itemsJustification === alignment ? undefined : alignment;
			setAttributes( {
				itemsJustification,
			} );
		}
	}

	const menuClasses = classnames( 'wp-block-mp-plain-menu', {
		[ `justify-items-${ attributes.itemsJustification }` ]: attributes.itemsJustification,
		[ `is-orientation-${attributes.orientation}`]: attributes.orientation
	});

	// UI State: rendered Block UI
	return (
		<>
			<BlockControls>
				<Toolbar
					icon={ attributes.itemsJustification ? `editor-align${attributes.itemsJustification}` : "editor-alignleft" }
					label={ __( 'Change items justification' ) }
					isCollapsed
					controls={ [
						{
							icon: "editor-alignleft",
							title: __( 'Justify items left' ),
							isActive: 'left' === attributes.itemsJustification,
							onClick: setAlignment( 'left' ),
						},
						{
							icon: "editor-aligncenter",
							title: __( 'Justify items center' ),
							isActive:
								'center' === attributes.itemsJustification,
							onClick: setAlignment( 'center' ),
						},
						{
							icon: "editor-alignright",
							title: __( 'Justify items right' ),
							isActive: 'right' === attributes.itemsJustification,
							onClick: setAlignment( 'right' ),
						},
					] }
				/>
				<ToolbarGroup>
					<ToolbarButton
						name="orientation"
						icon="image-rotate-right"
						title={ attributes.orientation === 'vertical' ? __('Make horizontal') : __('Make vertical') }
						isActive={ attributes.orientation === 'vertical' }
						onClick={ () => {
							setAttributes( {
								orientation: attributes.orientation === 'vertical' ? 'horizontal' : 'vertical',
							} )
						} }
					/>
				</ToolbarGroup>
			</BlockControls>
			<InspectorControls>
			</InspectorControls>
			<div className={ menuClasses }>
				<div className="wp-block-mp-plain-menu__content">
					<InnerBlocks
						ref={ ref }
						template={ TEMPLATE }
						templateLock={ false }
						allowedBlocks={ ALLOWED_BLOCKS }
						templateInsertUpdatesSelection={ false }
						renderAppender={
							( isImmediateParentOfSelectedBlock &&
								! selectedBlockHasDescendants ) ||
							isSelected
								? InnerBlocks.DefaultAppender
								: false
						}
						__experimentalMoverDirection={ attributes.orientation }
					/>
				</div>
			</div>
		</>
	);
}

export default compose( [
	withSelect( ( select, { clientId } ) => {
		const {
			getClientIdsOfDescendants,
			hasSelectedInnerBlock,
			getSelectedBlockClientId,
		} = select( 'core/block-editor' );
		const isImmediateParentOfSelectedBlock = hasSelectedInnerBlock(
			clientId,
			false
		);
		const selectedBlockId = getSelectedBlockClientId();
		const selectedBlockHasDescendants = !! getClientIdsOfDescendants( [
			selectedBlockId,
		] )?.length;
		return {
			isImmediateParentOfSelectedBlock,
			selectedBlockHasDescendants
		};
	} ),
] )( PlainMenu );
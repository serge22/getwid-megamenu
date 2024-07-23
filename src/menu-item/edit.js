/**
 * External dependencies
 */
import classnames from 'classnames';
import Controls from "./controls";

/**
 * WordPress dependencies
 */
const { __ } = wp.i18n;
const {
	useState,
	useEffect,
	useRef
} = wp.element;
const { compose } = wp.compose;
const { withSelect, withDispatch } = wp.data;
const {
	RichText,
	InnerBlocks,
} = wp.blockEditor;

/**
 * Internal dependencies
 */
function MenuItemEdit( props ) {
	const {
		attributes,
		setAttributes,
		isSelected,
		onReplace,
		mergeBlocks,
		isParentOfSelectedBlock,
		hasDescendants,
		updateInnerBlocks,
		rootBlockClientId,
		parentAttributes
	} = props;
	const {
		text,
	} = attributes;

	const itemLabelPlaceholder = __( 'Add link…' );
	const [isItemDropdownOpened, setIsItemDropdownOpened] = useState(hasDescendants);
	const isMenuItemSelected = isSelected || isParentOfSelectedBlock;
	const menuItemHasChildrens = isItemDropdownOpened || hasDescendants;
	const showDropdown = isMenuItemSelected && menuItemHasChildrens;
	const [dropdownPosition, setDropdownPosition] = useState( { left:0, width: 'auto' } );
	const menuItem = useRef(null);

	const toggleItemDropdown = () => {
		setIsItemDropdownOpened(!isItemDropdownOpened);
		if(hasDescendants){
			updateInnerBlocks();
		}
		return false;
	};

	const updateDropdownPosition = () => {
		let newDropdownPosition = {};
		let rootBlockNode;
		const blockNode = menuItem.current;

        if (!blockNode) {
           return;
        }

		const blockCoords = blockNode.getBoundingClientRect();

		if ( parentAttributes.expandDropdown ) {
			rootBlockNode = blockNode.closest('.editor-styles-wrapper');
		} else {
			rootBlockNode = blockNode.closest( '[data-block="' + rootBlockClientId + '"]' ).querySelector('.wp-block-getwid-megamenu');
		}

		const rootCoords = rootBlockNode.getBoundingClientRect();

		let left = -(blockCoords.x - rootCoords.x);

		if ( parentAttributes.dropdownMaxWidth && rootCoords.width > parentAttributes.dropdownMaxWidth ) {
			left = left + (rootCoords.width - parentAttributes.dropdownMaxWidth) / 2;
		}

		newDropdownPosition = {left: left, width: rootCoords.width};

		if( newDropdownPosition.left !== dropdownPosition.left
			|| newDropdownPosition.width !== dropdownPosition.width ) {
			setDropdownPosition(newDropdownPosition);
		}
	};

	useEffect( () => {
		updateDropdownPosition();
	}, [ isSelected ] );

	useEffect( () => {
		const blockNode = menuItem.current;
        if (blockNode) {
            blockNode.ownerDocument.defaultView.addEventListener('resize', updateDropdownPosition);
        }
	}, [] );

	useEffect( () => {
		setAttributes( {
			fontSize: parentAttributes.menuItemFontSize,
			customFontSize: parentAttributes.customMenuItemFontSize,
			textColor: parentAttributes.menuItemColor,
			customTextColor: parentAttributes.customMenuItemColor,
		} );
	}, [] );

	const dropdownWrapperStyle = {
		left: dropdownPosition.left,
		width: dropdownPosition.width,
		maxWidth: parentAttributes.dropdownMaxWidth
	};

	const dropdownStyle = {
		backgroundColor: attributes.customDropdownBackgroundColor
	};

	const dropdownContentStyle = {
		maxWidth: parentAttributes.dropdownContentMaxWidth
	};

	const dropdownClasses = classnames('gw-mm-item__dropdown', {
		'has-background': attributes.dropdownBackgroundColor || attributes.customDropdownBackgroundColor,
		[ `has-${ attributes.dropdownBackgroundColor }-background-color` ]: !! attributes.dropdownBackgroundColor,
	});

	const itemClasses = classnames(
		'wp-block-getwid-megamenu-item',
		'gw-mm-item',
		{
			'has-child': hasDescendants,
			'is-opened': showDropdown
		}
	);

	const itemLinkClasses = classnames(
		'gw-mm-item__link',
		{
			'has-text-color': attributes.textColor || attributes.customTextColor,
			[ `has-${ attributes.textColor }-color` ]: !! attributes.textColor,
			[ `has-${ attributes.fontSize }-font-size` ]: !! attributes.fontSize
		}
	);

	const itemLinkStyles = {
		color: attributes.customTextColor,
		fontSize: attributes.customFontSize
	};

	return (
		<>
			<div className={itemClasses} ref={menuItem}>
				<div className={itemLinkClasses} style={itemLinkStyles}>
					<a>
						<RichText
							placeholder={ itemLabelPlaceholder }
							value={ text }
							onChange={ ( value ) => setAttributes( { text: value } ) }
							withoutInteractiveFormatting
							onReplace={ onReplace }
							onMerge={ mergeBlocks }
							identifier="text"/>
						{
							(menuItemHasChildrens) && (
								<span className="gw-mm-item__dropdown-icon">
									<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512" class="caret-down">
										<path d="M137.4 374.6c12.5 12.5 32.8 12.5 45.3 0l128-128c9.2-9.2 11.9-22.9 6.9-34.9s-16.6-19.8-29.6-19.8L32 192c-12.9 0-24.6 7.8-29.6 19.8s-2.2 25.7 6.9 34.9l128 128z"/>
									</svg>
								</span>
							)
						}
					</a>
				</div>
				{
					(showDropdown) && (
						<div className='gw-mm-item__dropdown-wrapper' style={dropdownWrapperStyle}>
							<div className={dropdownClasses} style={dropdownStyle}>
								<div className='gw-mm-item__dropdown-content' style={dropdownContentStyle}>
									<InnerBlocks/>
								</div>
							</div>
						</div>
					)
				}
			</div>
			<Controls
				{ ...props }
				toggleItemDropdown={ toggleItemDropdown }
				isItemDropdownOpened={ isItemDropdownOpened }
			/>
		</>
	);
}

export default compose([
	withSelect((select, ownProps) => {
		const {
			hasSelectedInnerBlock,
			getBlockCount,
			getBlockParentsByBlockName,
			getBlock
		} = select('core/block-editor');
		const { clientId } = ownProps;
		const isParentOfSelectedBlock = hasSelectedInnerBlock(clientId, true);
		const hasDescendants = !!getBlockCount(clientId);
		const rootBlockClientId = getBlockParentsByBlockName( clientId, 'getwid-megamenu/menu' )[0];

		const parentAttributes = getBlock(rootBlockClientId).attributes;

		return {
			isParentOfSelectedBlock,
			hasDescendants,
			rootBlockClientId,
			parentAttributes
		};
	}),
	withDispatch( ( dispatch, { clientId } ) => {
		return {
			updateInnerBlocks( blocks ) {
				dispatch( 'core/block-editor' ).replaceInnerBlocks(
					clientId,
					[],
					false
				);
			},
		};
	} ),
])(MenuItemEdit);

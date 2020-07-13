/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
const { head } = lodash;
const {__} = wp.i18n;
const {useCallback, useState, useRef, useEffect} = wp.element;
const {compose} = wp.compose;
const {withSelect, withDispatch} = wp.data;
const {
	KeyboardShortcuts,
	PanelBody,
	RangeControl,
	TextControl,
	ToggleControl,
	ToolbarButton,
	ToolbarGroup,
	Popover,
} = wp.components;
const {
	BlockControls,
	InspectorControls,
	RichText,
	InnerBlocks,
	__experimentalBlock,
	__experimentalLinkControl,
} = wp.blockEditor;
const {rawShortcut, displayShortcut} = wp.keycodes;
const {createBlock} = wp.blocks;

/**
 * Internal dependencies
 */

const NEW_TAB_REL = 'noreferrer noopener';

function MenuItemToolbar(args) {
    const {
        isSelected,
        url,
        setAttributes,
        opensInNewTab,
        onToggleOpenInNewTab,
	    toggleItemPopup,
        isItemPopupOpened,
	    hasDescendants
    } = args;
	const [isURLPickerOpen, setIsURLPickerOpen] = useState(false);

	const isURLSet = !(url === undefined || url.trim().length === 0);

	const openLinkControl = () => {
		setIsURLPickerOpen(true);
		return false; // prevents default behaviour for event
	};

	const unlinkItem = () => {
		setAttributes( {
			url: undefined,
			linkTarget: undefined,
			rel: undefined,
		} );
		setIsURLPickerOpen( false );
	};

	const linkControl = isURLPickerOpen && (
		<Popover position="top center" onClose={() => setIsURLPickerOpen(false)}>
			<__experimentalLinkControl
				className="wp-block-navigation-link__inline-link-input"
				value={{
					url,
					opensInNewTab
				}}
				onChange={ ( {
	                url: newURL = '',
	                opensInNewTab: newOpensInNewTab,
                } ) => {
					setAttributes({url: newURL});

					if (opensInNewTab !== newOpensInNewTab) {
						onToggleOpenInNewTab(newOpensInNewTab);
					}
				} }
			/>
		</Popover>
	);

	return (
		<>
			<BlockControls>
				<ToolbarGroup>
					<ToolbarButton name="link" icon="admin-links" title={__('Edit Link')} onClick={openLinkControl} isActive={isURLSet}/>
					<ToolbarButton name="unlink" icon="editor-unlink" title={__('Unlink')} onClick={unlinkItem} isDisabled={!isURLSet}/>
				</ToolbarGroup>
				<ToolbarGroup>
	                <ToolbarButton
	                    name="submenu"
	                    icon="download"
	                    title={ __( 'Add submenu' ) }
	                    onClick={ toggleItemPopup }
	                />
				</ToolbarGroup>
			</BlockControls>
			{linkControl}
		</>
	);
}

function MenuItemEdit(props) {
	const {
		attributes,
		setAttributes,
		className,
		isSelected,
		onReplace,
		mergeBlocks,
		isParentOfSelectedBlock,
		hasDescendants,
		updateInnerBlocks,
		rootBlockClientId,
		clientId
	} = props;
	const {
		linkTarget,
		rel,
		text,
		url,
	} = attributes;

	const onSetLinkRel = useCallback(
		(value) => {
			setAttributes({rel: value});
		},
		[setAttributes]
	);

	const itemLabelPlaceholder = __( 'Add link…' );

    const [isItemPopupOpened, setIsItemPopupOpened] = useState(hasDescendants);


    const toggleItemPopup = () => {
	    setIsItemPopupOpened(!isItemPopupOpened);
	    if(hasDescendants){
		    updateInnerBlocks();
	    }
        return false; // prevents default behaviour for event
    };

	const onToggleOpenInNewTab = useCallback(
		(value) => {
			const newLinkTarget = value ? '_blank' : undefined;

			let updatedRel = rel;
			if (newLinkTarget && !rel) {
				updatedRel = NEW_TAB_REL;
			} else if (!newLinkTarget && rel === NEW_TAB_REL) {
				updatedRel = undefined;
			}

			setAttributes({
				linkTarget: newLinkTarget,
				rel: updatedRel,
			});
		},
		[rel, setAttributes]
	);

	const itemClasses = classnames(
		'wp-block-mp-megamenu-menu-item',
		{
			'has-child': hasDescendants,
			'is-opened': (isSelected || isParentOfSelectedBlock) && (isItemPopupOpened || hasDescendants)
		}
	);

	const [popupPosition, setPopupPosition] = useState({left:0, width: 'auto'});

	const updatePopupPosition = () => {
		const rootBlockNode = document.querySelector( '[data-block="' + rootBlockClientId + '"] .wp-block-mp-megamenu-menu' );
		const blockNode = rootBlockNode.querySelector( '[data-block="' + clientId + '"]' );
		const rootCoords = rootBlockNode.getBoundingClientRect();
		const blockCoords = blockNode.getBoundingClientRect();
		const left = blockCoords.x - rootCoords.x;

		setPopupPosition({left: -left, width: rootCoords.width});
	};

	useEffect(() => {
		updatePopupPosition();
	}, [isSelected]);

	const popupStyle = {
		left: popupPosition.left,
		width: popupPosition.width
	};

	return (
		<>
			<div className={itemClasses}>
				<div className='wp-block-mp-megamenu-item__link'>
					<RichText
						placeholder={itemLabelPlaceholder}
						value={text}
						onChange={(value) => setAttributes({text: value})}
						withoutInteractiveFormatting
						onReplace={onReplace}
						onMerge={mergeBlocks}
						identifier="text"/>
				</div>
				{
					((isSelected || isParentOfSelectedBlock) && (isItemPopupOpened || hasDescendants)) && (
						<div className='wp-block-mp-megamenu-item__popup-wrapper' style={popupStyle}>
							<div className='wp-block-mp-megamenu-item__popup'>
								<InnerBlocks/>
							</div>
						</div>
					)
				}
			</div>

			<MenuItemToolbar
                url={url}
				toggleItemPopup={toggleItemPopup}
                isItemPopupOpened={isItemPopupOpened}
                setAttributes={setAttributes}
                isSelected={isSelected}
				hasDescendants
                opensInNewTab={linkTarget === '_blank'}
                onToggleOpenInNewTab={onToggleOpenInNewTab}/>
			<InspectorControls>
				<PanelBody title={__('Link settings')}>
					<ToggleControl label={__('Open in new tab')} onChange={onToggleOpenInNewTab} checked={linkTarget === '_blank'}/>
					<TextControl label={__('Link rel')} value={rel || ''} onChange={onSetLinkRel}/>
				</PanelBody>
			</InspectorControls>
		</>
	);
}

export default compose([
	withSelect((select, ownProps) => {
		const {
			hasSelectedInnerBlock,
			getClientIdsOfDescendants,
			getBlockParentsByBlockName,
		} = select('core/block-editor');
		const {clientId} = ownProps;
		const isParentOfSelectedBlock = hasSelectedInnerBlock(clientId, true);
		const hasDescendants = !!getClientIdsOfDescendants([clientId])
			.length;
		const rootBlockClientId = head(
			getBlockParentsByBlockName( clientId, 'mp-megamenu/menu' )
		);

		return {
			isParentOfSelectedBlock,
			hasDescendants,
			rootBlockClientId,
			clientId
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

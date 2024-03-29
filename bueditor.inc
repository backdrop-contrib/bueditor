<?php

/**
 * @file
 * Implements commonly used functions for bueditor.
 */

/**
 * Load and return editors by id.
 */
function bueditor_editors($id = NULL) {

  if (empty($id)) {
    return FALSE;
  }

  static $editors = array(), $gotall = FALSE;

  if ($id === 'all') {
    if (!$gotall) {
      $gotall = TRUE;

      $prefix = 'bueditor.editor.';
      $config_names = config_get_names_with_prefix($prefix);

      foreach ($config_names as $config_name) {
        $config = config($config_name);
        $get_editor = $config->get();
        $editors[$get_editor['id']] = (object) $get_editor;
      }

      // Sort by weight then title.
      backdrop_sort($editors, array(
        'title' => SORT_STRING,
      ));
    }
    return $editors;
  }
  //elseif (!isset($editors[$id]) && !$gotall && $id != '') {
    $config = config('bueditor.editor.' . $id);
    if ($get_editor = $config->get()) {
      $editors[$get_editor['id']] = (object) $get_editor;
    }
  //}
  return isset($editors[$id]) ? $editors[$id] : FALSE;
}

/**
 * All buttons of an editor.
 */
function bueditor_buttons($id) {
  $get_buttons = config_get('bueditor.editor.' . $id, 'buttons');
  if (!$get_buttons) {
    return array();
  }
  // Sort by weight then title.
  backdrop_sort($get_buttons, array(
    'weight' => SORT_NUMERIC,
    'title' => SORT_STRING,
  ));

  $buttons = array();
  foreach ($get_buttons as $button) {
    $buttons[$button['bid']] = (object) $button;
  }
  return $buttons;
}

/**
 * Processed buttons. Evaluate php code for php buttons and translate titles prefixed with t:.
 */
function bueditor_processed_buttons($id) {
  $buttons = array();
  foreach (bueditor_buttons($id) as $bid => $button) {
    if (($content = $button->content) && substr($content, 0, 4) == 'php:') {
      if (!$content = bueditor_eval(substr($content, 4))) {
        // PHP returned false or nothing. include empty button in order not to break sprite index.
        if (substr($button->title, 0, 4) != 'tpl:' && preg_match('/\.(png|gif|jpg)$/', $button->icon)) {
          $buttons[] = array();
        }
        continue;
      }
    }
    $title = substr($button->title, 0, 2) == 't:' ? call_user_func('t', trim(substr($button->title, 2))) : $button->title;
    $buttons[] = array($title, $content, $button->icon, $button->accesskey);
  }
  return $buttons;
}

/**
 * Integrate the editor into textarea element.
 */
function _bueditor_textarea($element, $form_state) {
  static $editors, $textareas = array();

  if (isset($textareas[$element['#id']])) {
    return $element;
  }
  $textareas[$element['#id']] = TRUE;

  // Check if this field instance has text processing enabled (filtered text
  // with text format selection).
  if (isset($element['#entity_type']) && isset($element['#field_name']) && $element['#bundle']) {
    $instance = field_info_instance($element['#entity_type'], $element['#field_name'], $element['#bundle']);
    // If text processing is 0 (plain text), don't show the editor for this
    // textarea (plain text format doesn't allow any html).
    if (!empty($instance) && empty($instance['settings']['text_processing'])) {
      return $element;
    }
  }

  // Get editors
  if (!isset($editors)) {
    $editors = bueditor_user_editor_ids($GLOBALS['user']);
    $editors[0] = bueditor_check_page($_GET['q'], $editors[0]);
  }

  // If the first editor does not settle try the second.
  if (!bueditor_preset_textarea($element['#id'], $editors[0]) && $editors[1]) {
    if (!isset($editors[1]->id)) {
      $editors[1] = bueditor_check_page($_GET['q'], $editors[1]);
    }
    bueditor_preset_textarea($element['#id'], $editors[1]);
  }

  return $element;
}

/**
 * Insert textarea id into preset of the editor.
 */
function bueditor_preset_textarea($tid, $editor) {
  if ($editor && !bueditor_check_match($editor->excludes, $tid)) {
    bueditor_settle($editor->id);
    $settings['BUE']['preset'][$tid] = 'e' . $editor->id;
    backdrop_add_js($settings, 'setting');
    return TRUE;
  }
  return FALSE;
}

/**
 * Include necessary js and css files for editor settlement.
 */
function _bueditor_settle($id) {
  static $settled = array();
  if (isset($id)) {
    $editor = bueditor_editors($id);
  }
  if ($id && !isset($settled[$id])) {
    $settings = array();
    $path = backdrop_get_path('module', 'bueditor');
    // Run once
    if (empty($settled)) {
      backdrop_add_css($path . '/bueditor.css');
      backdrop_add_js($path . '/bueditor.js');
      if (module_invoke('imce', 'access')) {
        $settings['BUE']['imceURL'] = url('imce');
      }
      module_invoke('ajax_markup', 'on');
    }
    $editor->iconpath = bueditor_path_tr($editor->iconpath);
    bueditor_add_library($editor->librarypath);
    $settings['BUE']['templates']['e' . $editor->id] = array(
      'iconpath' => base_path() . $editor->iconpath,
      'buttons' => bueditor_processed_buttons($editor->id),
    );
    if ($editor->spriteon && $editor->spritename) {
      $sprite_path = bueditor_sprites_dir() . '/' . $editor->spritename;
      if (file_exists($sprite_path) && ($info = getimagesize($sprite_path))) {
        $settings['BUE']['templates']['e' . $editor->id]['sprite'] = array(
          'url' => file_create_url($sprite_path),
          'unit' => $info[1],
          'x1' => base_path() . $path . '/icons/x1.png',
        );
      }
    }
    backdrop_add_js($settings, 'setting');
    $settled[$editor->id] = TRUE;
  }
  return $editor && isset($settled[$editor->id]);
}

/**
 * Include js and css files from library.
 */
function bueditor_add_library($library) {
  $internal = array('weight' => JS_THEME);
  $external = array('type' => 'external', 'scope' => 'footer');
  foreach (bueditor_get_library($library) as $key => $file) {
    $options = strpos($file, '://') ? $external : $internal;
    $ext = substr($file, -4);
    if ($ext == '.css') {
      backdrop_add_css($file, $options);
    }
    elseif (substr($ext, 1) == '.js') {
      backdrop_add_js($file, $options);
    }
  }
}

/**
 * Get an array of js and css files defined in editor library.
 */
function bueditor_get_library($library) {
  $files = array();
  foreach (preg_split("/\s+/", $library) as $path) {
    if ($path && $trpath = bueditor_path_tr($path)) {
      $files[$path] = $trpath;
    }
  }
  return $files;
}

/**
 * Return the editor ids assigned to the user.
 */
function bueditor_user_editor_ids($user) {
  $config = config('bueditor.settings');
  // User #1
  if ($user->uid == 1) {
    return array($config->get('bueditor_user1'), $config->get('bueditor_user1_alt'));
  }
  $roles = $config->get('bueditor_roles');
  // Anonymous user
  if (empty($user->uid)) {
    $rid = BACKDROP_ANONYMOUS_ROLE;
    return isset($roles[$rid]) ? array($roles[$rid]['editor'], $roles[$rid]['alt']) : array('', '');
  }
  // Other users
  foreach ($roles as $rid => $role) {
    if (in_array($rid, $user->roles) && ($role['editor'] || $role['alt'])) {
      return array($role['editor'], $role['alt']);
    }
  }
  return array('', '');
}

/**
 * Check if the editor is visible in the page.
 */
function bueditor_check_page($page, $editor) {
  $editor = isset($editor) ? bueditor_editors($editor) : $editor;
  if ($editor) {
    if (backdrop_match_path($page, $editor->pages)) {
      return $editor;
    }
    $alias = backdrop_get_path_alias($page);
    if ($alias != $page && backdrop_match_path($alias, $editor->pages)) {
      return $editor;
    }
    if (arg(0) == 'node' && arg(2) == 'edit') {
      $node = node_load(arg(1));
      if ($node && backdrop_match_path('node/add/' . str_replace('_', '-', $node->type), $editor->pages)) {
        return $editor;
      }
    }
  }

  return FALSE;
}

/**
 * Check matching lines of the needle in haystack.(page and textarea id)
 */
function bueditor_check_match($needle, $haystack) {
  if ($needle == '') {
    return FALSE;
  }
  $needle = '/^' . preg_replace("/\r\n?|\n/", '|', str_replace(array('*', '-', '/'), array('.*', '\\-', '\\/'), trim($needle))) . '$/';
  return preg_match($needle, $haystack);
}

/**
 * Translate editor paths.
 */
function bueditor_path_tr($path, $reverse = FALSE) {
  if (!$path) {
    return $path;
  }
  static $tokens;
  if (!isset($tokens)) {
    $tokens = array(
      '%BUEDITOR' => backdrop_get_path('module', 'bueditor'),
      '%FILES' => bueditor_public_dir(),
      '%THEME' => isset($GLOBALS['theme']) ? backdrop_get_path('theme', $GLOBALS['theme']) : path_to_theme(),
    );
  }
  if ($reverse) {
    return strtr($path, array_flip($tokens));
  }
  $trpath = strtr($path, $tokens);
  // For themes missing icon or library directory, switch to default theme.
  if (!file_exists($trpath) && substr($path, 0, 6) == '%THEME') {
    $trpath = str_replace('%THEME', backdrop_get_path('theme', config_get('system.core', 'theme_default')), $path);
  }
  return $trpath;
}

/**
 * Evaluate PHP code.
 */
function bueditor_eval($code) {
  ob_start();
  print eval('?><?php ' . $code . ' ?>');
  $output = ob_get_contents();
  ob_end_clean();
  return $output;
}

/**
 * Return Backdrop's public directory path.
 */
function bueditor_public_dir() {
  return config_get('system.core', 'file_public_path');
}

/**
 * Return sprites directory
 */
function bueditor_sprites_dir() {
  return bueditor_public_dir() . '/' . config_get('bueditor.settings', 'bueditor_sprites_dir');
}

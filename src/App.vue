<template>
    <div class="d-print-none m-1 container-fluid">
        <!-- top area -->
        <nav class="navbar navbar-expand-lg bg-light">
            <div class="container-fluid">
                <button class="navbar-toggler" type="button" data-bs-toggle="collapse" @click="toggleNavBarCtl">
                    <span class="navbar-toggler-icon"></span>
                </button>
                <a class="navbar-brand" href="#" @click.prevent="goHome">
                    🏠 {{ $gettext('TY Seating Chart') }}
                    <img src="https://img.shields.io/github/commit-activity/t/tyroneyeh/SeatingChart?logoColor=%23fff&label=Ver.&labelColor=%23fff&color=%23fff" alt="Version" />
                </a>
                <div class="collapse navbar-collapse" :class="{ show: toggleNavbar }">
                    <ul class="navbar-nav m-auto">
                        <a class="nav-link text-center">{{ $gettext('Columns') }} <input type="number" class="w-50px" v-model="totalX" min="1" ref="totalxs" @change="store" @focus="$event.target.select()" /></a>
                        <a class="nav-link text-center">{{ $gettext('Rows') }} <input type="number" class="w-50px" v-model="totalY" min="1" ref="totalys" @change="store" @focus="$event.target.select()" /></a>
                        <a class="nav-link text-center">{{ $gettext('Seats') }} <input type="number" class="w-50px" min="1" ref="totalnums" @change="store" :value="totalX * totalY" :disabled="true" /></a>
                        <li class="nav-item dropdown position-relative text-center">
                            <button class="form-control-sm btn-outline-secondary dropdown-toggle" type="button" @click="toggleSubmenu = !toggleSubmenu" accesskey="m">{{ $gettext('Methods') }}</button>
                            <ul class="dropdown-menu show" v-if="toggleSubmenu">
                                <li><button class="dropdown-item" type="button" @click="editPaste(null, 'namelist', 1)">{{ $gettext('Paste') }}</button></li>
                                <li><button class="dropdown-item" type="button" @click="triggerUpload">{{ $gettext('Upload') }}</button></li>
                                <li v-if="storeData"><button class="dropdown-item" type="button" @click="download">{{ $gettext('Download') }}</button></li>
                                <li><button class="dropdown-item" type="button" @click="randomPos">{{ $gettext('Random') }}</button></li>
                                <li><button class="dropdown-item" type="button" @click="print">{{ $gettext('Print') }}</button></li>
                                <li><button class="dropdown-item" type="button" @click="shareData">{{ $gettext('Share') }}</button></li>
                                <li><hr class="dropdown-divider" /></li>
                                <li><button class="dropdown-item" type="button" :disabled="clearBtnCtl" @click="resetPos">{{ $gettext('Reset') }}</button></li>
                                <li><button class="dropdown-item" type="button" :disabled="!hasValidColors" @click="clearColors">{{ $gettext('Clear Colors') }}</button></li>
                                <li><button class="dropdown-item" type="button" :disabled="!photos?.length" @click="clearPhotos">{{ $gettext('Clear Photos') }}</button></li>
                                <li v-if="storeData"><button class="dropdown-item" type="button" @click="clearStore">{{ $gettext('Clear') }}</button></li>
                            </ul>
                        </li>
                        <input ref="uploadfile" id="uploadfile" type="file" @change="uploadfileChange($event)" class="visually-hidden" accept="application/json" />
                        <div class="text-center text-nowrap h-100">
                            <button class="form-control-sm" :title="$gettext('Font size')" @click="adujstFont('-')" :disabled="fontButtonCtl">-</button>
                            <select class="form-control-sm" v-model="fontPos">
                                <option value="l">{{ $gettext('Left') }}</option>
                                <option value="c">{{ $gettext('Center') }}</option>
                                <option value="r">{{ $gettext('Right') }}</option>
                            </select>
                            <button class="form-control-sm" :title="$gettext('Font size')" @click="adujstFont('+')">+</button>
                        </div>
                        <div class="text-center">
                            <button class="form-control-sm btn-outline-secondary dropdown-toggle" type="button" @click="toggleOptionmenu = !toggleOptionmenu" accesskey="o">{{ $gettext('Options') }}</button>
                            <div class="dropdown-menu form-switch show" @mouseleave="startHideOptionMenu" @mouseenter="keepMenuOptionOpen" v-if="toggleOptionmenu">
                                <label class="nav-link form-switch ms-5"><input type="checkbox" class="form-check-input" v-model="showList" />&nbsp;{{ $gettext('Lists') }}</label>
                                <label class="nav-link form-switch ms-5"><input type="checkbox" class="form-check-input" v-model="showTitle" />&nbsp;{{ $gettext('Title') }}</label>
                                <label class="nav-link form-switch ms-5"><input type="checkbox" class="form-check-input" v-model="showDate" />&nbsp;{{ $gettext('Date') }}</label>
                                <label class="nav-link form-switch ms-5"><input type="checkbox" class="form-check-input" v-model="showLeader" />&nbsp;{{ $gettext('Leaders') }}</label>
                                <label class="nav-link form-switch ms-5"><input type="checkbox" class="form-check-input" v-model="showNote" />&nbsp;{{ $gettext('Note') }}</label>
                                <li><hr class="dropdown-divider" /></li>
                                <label class="nav-link form-switch ms-5"><input type="checkbox" class="form-check-input" v-model="showSeats" />&nbsp;{{ $gettext('Seats') }}</label>
                                <label class="nav-link form-switch ms-5"><input type="checkbox" class="form-check-input" v-model="showNumber" :disabled="!showSeats" />&nbsp;{{ $gettext('Numbers') }}</label>
                                <label class="nav-link form-switch ms-5"><input type="checkbox" class="form-check-input" v-model="showPlace" :disabled="!showSeats" />&nbsp;{{ $gettext('Place') }}</label>
                                <label class="nav-link form-switch ms-5"><input type="checkbox" class="form-check-input" v-model="showName" :disabled="!showSeats" />&nbsp;{{ $gettext('Names') }}</label>
                                <label class="nav-link form-switch ms-5"><input type="checkbox" class="form-check-input" v-model="showVertical" :disabled="!showSeats" />&nbsp;{{ $gettext('Vertical') }}</label>
                                <label class="nav-link form-switch ms-5"><input type="checkbox" class="form-check-input" v-model="showDesk" :disabled="!showSeats" />&nbsp;{{ $gettext('Desk') }}</label>
                                <label class="nav-link form-switch ms-5"><input type="checkbox" class="form-check-input" v-model="deskPos" :disabled="!showSeats" />&nbsp;{{ $gettext('Reverse') }}</label>
                                <li><hr class="dropdown-divider" /></li>
                                <label class="nav-link form-switch ms-5"><input type="checkbox" class="form-check-input" v-model="speechVoice" />&nbsp;{{ $gettext('Voice') }}</label>
                                <label class="nav-link form-switch ms-5"><input type="checkbox" class="form-check-input" v-model="showPhoto" :disabled="!photos?.length" />&nbsp;{{ $gettext('Photo') }}</label>
                                <label class="nav-link form-switch ms-5"><input type="checkbox" class="form-check-input" v-model="onlyPhoto" :disabled="!showPhoto" />&nbsp;{{ $gettext('Only Photo') }}</label>
                            </div>
                        </div>
                        <div class="text-center h-100">
                            <select class="form-control-sm" v-model="showFonts">
                                <option value="">{{ $gettext('Fonts') }}</option>
                                <option v-for="font in fonts" :key="font.family" :value="font.family">{{ font.name }}</option>
                            </select>
                        </div>
                        <button class="form-control-sm h-100 text-nowrap" @click="binGo" :disabled="bingoButtonCtl" accesskey="b">{{ $gettext('Bingo') }}</button>
                    </ul>
                </div>
            </div>
        </nav>
        <div class="alert alert-primary p-1 m-auto text-center" @click="tipsToHide" v-show="!hideTips">{{ $gettext('Please directly click on the name or seat number area to enter information') }}</div>
        <div class="d-flex justify-content-center">
            <div class="overflow-x-auto position-relative">
                <a class="px-2 mx-1 cursor-pointer" v-for="i in 48" :key="i" :class="{ border: i == 1, 'border border-primary': colorIndex == i }" :style="{ backgroundColor: i == 1 ? '' : `hsl(${(i - 2) * (360 / 48)}, 70%, 85%)` }" @click="colorIndex = i"><span class="visually-hidden"></span></a>
            </div>
        </div>
    </div>

    <div class="container-fluid row mx-auto" :style="{ 'font-size': fontSizeR + 'em' }">
        <div class="col-sm-3"></div>
        <div class="text-nowrap text-center col-sm-6 namearea with-pencil" v-show="showTitle" @click="startEdit($event.target)" @blur="endEdit($event)" ref="tabletitle">{{ $gettext('Seating charts') }}</div>
        <div class="col-sm-6" v-show="!showTitle"></div>
        <div class="text-nowrap text-end col-sm-3" v-show="showDate">
            <span class="namearea with-pencil" @click="startEdit($event.target)" @blur="endEdit($event)" ref="updateLabel">{{ $gettext('Date') }}:</span>
            <span class="ps-2 with-pencil" @click="startEdit($event.target)" @blur="endEdit($event, 'today')" ref="today"></span>
        </div>
    </div>

    <div id="print-area" class="container-fluid row mx-auto">
        <div class="col-lg-2 col-md-2 col-sm-2 pt-1 table-responsive overflow-x-hidden resize-y" v-show="showList">
            <!-- left area -->
            <table class="table table-bordered table-striped small namelist">
                <thead>
                    <tr class="border-secondary small">
                        <th class="ps-3 py-1 no-border-right min-w-25">
                            <input class="form-check-input d-print-none" type="checkbox" ref="nameBtnCtl" @change="nameBtnCtlChange($event)" />
                        </th>
                        <th class="text-nowrap py-1 no-border-left w-75 namearea with-pencil" :style="{ 'font-size': fontSizeL + 'em' }" @click="startEdit($event.target)" @blur="endEdit($event)" ref="studentListLabel">
                            {{ $gettext('Lists') }}
                        </th>
                    </tr>
                </thead>
                <tbody>
                    <tr class="seat-container" v-for="n in totalNamelist" :key="'student-' + n" @mouseover="tipPhoto(n)" @mouseout="photo = null" :class="{ 'border-secondary': n % 5 == 0, dragging: draggingPos == `student-${n}` }" :style="{ 'font-size': fontSizeL + 'em' }" draggable="true" @dragstart="dragStart($event, 'student', n)" @dragover.prevent @drop="drop($event, n)">
                        <td class="p-1" :class="{ 'border-start': n % 5 == 0 }" v-show="showNumber" :colspan="!showName ? 2 : 0">
                            <label class="d-flex w-100">
                                <input class="form-check-input d-print-none" type="checkbox" @click="doSpeak(n)" @focus="showPos(n, 1)" @keydown="editKeydown($event, 'nameBgCtl', n)" ref="nameBgCtl" v-model="nameBgCtlChecked" :value="namelist[n - 1]?.innerText && n" />
                                <span class="d-none d-print-block px-1 mobile-no-print">{{ nameBgCtl[n - 1]?.checked ? '✓' : '☐' }}</span>
                                <span class="d-flex justify-content-end min-w-20px">{{ n }}</span>
                            </label>
                        </td>
                        <td class="py-1 namearea text-truncate with-pencil" v-show="showName" :class="{ 'border-end': n % 5 == 0 }" :colspan="!showNumber ? 2 : 0" @focus="showPos(n, 1)" @paste.stop="editPaste($event, 'namelist', n)" @keydown="editKeydown($event, 'namelist', n)" @click="startEdit($event.target); toggleColor($event)" @blur="endEdit($event)" ref="namelist" @mouseover="setTitle($event)"></td>
                    </tr>
                </tbody>
            </table>
        </div>

        <div class="bg-white seats px-0" :class="{ 'col-lg-8 col-md-7 col-sm-7': showList && (showLeader || showNote), 'col-lg-10 col-md-10 col-sm-10': showList && !(showLeader || showNote), 'col-lg-10 col-md-9 col-sm-9': !showList && (showLeader || showNote), 'col-lg-12 col-md-12 col-sm-12': !showList && !(showLeader || showNote), 'pos-container': deskPos }" :style="{ 'font-size': fontSizeC + 'em' }" v-show="showSeats">
            <!-- center area -->
            <div class="row g-1" v-for="y in totalY" :key="'row' + y + 'x' + totalX">
                <div class="col py-1" v-for="x in totalX" :key="'seat' + y + '-' + x">
                    <div class="p-0 seat-row seat-container h-100 d-flex flex-column" :class="{ 'bg-info': highlightedPos && posdata[indexPos(x, y)]?.innerText == highlightedPos, dragging: draggingPos == `seat-${indexPos(x, y)}` }" :style="{ 'background-color': backgroundColor(colors[indexPos(x, y)]) }" @click="toggleColor($event, indexPos(x, y))" draggable="true" @dragstart="dragStart($event, 'seat', indexPos(x, y))" @dragover.prevent @drop="drop($event, indexPos(x, y))">
                        <div class="border-bottom text-center bg-light bg-opacity-25 possize">
                            <span class="with-pencil" :class="{ 'w-100': !showPhoto || onlyPhoto }" v-show="showNumber" @paste.stop="editPaste($event, 'posdata', indexPos(x, y))" @keydown="editKeydown($event, 'posdata', indexPos(x, y))" @click.stop="startEdit($event.target)" @blur="endEdit($event, 'posdata', $event.target.innerText, indexPos(x, y))" :ref="(el) => { if (el) posdata[indexPos(x, y)] = el; }"></span>
                            <span class="namearea" v-if="showName && showPhoto && !onlyPhoto">{{ posname[indexPos(x, y)]?.innerText }}</span>
                        </div>
                        <div class="fs-6 text-light text-end" v-show="showPlace">{{ `${x}-${totalY - y + 1}` }}</div>
                        <div class="text-center mx-auto namearea align-items-center justify-content-center with-pencil" :class="{ 'd-none': !showName || showPhoto, 'mb-2': showVertical, 'mb-3': !showVertical, 'vertical-text': showVertical, 'pt-1': !showPlace, 'pb-3': showPlace }" @click.stop="startEdit($event.target); toggleColor($event, indexPos(x, y))" @blur="endEdit($event, 'posname', $event.target.innerText, indexPos(x, y))" :ref="(el) => { if (el) posname[indexPos(x, y)] = el; }">&nbsp;</div>
                        <div class="text-center mx-auto namearea align-items-center justify-content-center" v-if="showPhoto">
                            <img draggable="false" class="w-100" :src="photos[posdata[indexPos(x, y)]?.innerText]" alt="" />
                        </div>
                    </div>
                </div>
            </div>
            <div class="row mx-auto m-2 resize-x" v-show="showDesk" :style="{ 'font-size': fontSizeR + 'em' }">
                <div class="mx-auto text-center desk namearea with-pencil" @click="startEdit($event.target)" @blur="endEdit($event)" ref="deskname">{{ $gettext('Desk') }}</div>
            </div>
        </div>

        <div class="pt-1" :class="{ 'col-lg-2 col-md-3 col-sm-3': (showList && showSeats) || (showSeats && showLeader), 'col-lg-10 col-md-10 col-sm-10': showList && !showSeats }">
            <!-- right area -->
            <table class="table table-bordered table-striped" :style="{ 'font-size': fontSizeR + 'em' }" v-show="showLeader">
                <colgroup>
                    <col class="col-w-30" />
                </colgroup>
                <thead>
                    <tr>
                        <th scope="row" colspan="2" class="text-justify-last bg-light namearea with-pencil" @click="startEdit($event.target)" @blur="endEdit($event)" ref="teacherLabel">{{ $gettext('Teacher') }}</th>
                    </tr>
                    <tr>
                        <td colspan="2" class="text-center ps-0 pe-0 text-nowrap namearea with-pencil h-2em" @click="startEdit($event.target)" @blur="endEdit($event)" ref="teacher"></td>
                    </tr>
                </thead>
                <tbody v-for="(n, index) in totalLeader" :key="'leader-' + index">
                    <tr class="leader-row" @drop="drop($event, index)">
                        <th scope="row" class="text-end text-nowrap text-justify-last namearea with-pencil h-2em" colspan="2" @click="startEdit($event.target)" @blur="endEdit($event)" @keydown="editKeydown($event, 'leadernames', n)" @paste.stop="editPaste($event, 'leadernames', n)" ref="leadernames"></th>
                    </tr>
                    <tr class="seat-container leader-row h-2em" :class="{ dragging: draggingPos == `leader-${index}` }" @mouseover="showPos(leaders[n - 1]?.innerText, 1)" @mouseout="showPos(leaders[n - 1]?.innerText, 0)" draggable="true" @dragstart="dragStart($event, 'leader', index)" @dragover.prevent @drop="drop($event, index)">
                        <td class="with-pencil" :class="{ 'text-end no-border-right': showName, 'text-center': !showName }" @click="startEdit($event.target)" :colspan="!showName ? 2 : 0" v-show="showNumber" @keydown="editKeydown($event, 'leaders', n)" @blur="endEdit($event, 'leaders', $event.target.innerText, n)" @paste.stop="editPaste($event, 'leaders', n)" ref="leaders"></td>
                        <td class="text-nowrap namearea no-border-left with-pencil" :class="{ 'text-center': !showNumber }" :colspan="!showNumber ? 2 : 0" v-show="showName" @click="startEdit($event.target)" ref="leadersname"></td>
                    </tr>
                </tbody>
            </table>
            <div class="card" v-show="showNote">
                <div class="card-header namearea with-pencil" :style="{ 'font-size': fontSizeR + 'em' }" @click="startEdit($event.target)" @blur="endEdit($event)" ref="noteLabel">{{ $gettext('Note') }}</div>
                <div class="card-body namearea with-pencil min-h-2em" :style="{ 'font-size': fontSizeR + 'em' }" @click="startEdit($event.target)" @blur="endEdit($event)" ref="note"></div>
            </div>
        </div>
    </div>

    <div v-if="photo" @click="photo = null" class="floating-img card p-0 m-0">
        <span class="close">✕</span>
        <div class="fs-6 text-end pe-2">&nbsp;<span v-show="showPlace">{{ seatsPos }}</span></div>
        <img :src="photo" alt="" />
        <p class="text-center namearea"><span v-show="showNumber">{{ photoNo }}&nbsp;</span><span v-show="showName">{{ photoName }}</span></p>
    </div>

    <div v-if="!photo && doBingo" @click="doBingo = false" class="floating-img card p-3 m-2 border-primary" :class="{ 'bg-info': !bingoButtonCtl }">
        <span class="close">✕</span>
        <div class="fs-6 text-end pe-2">&nbsp;<span v-show="showPlace">{{ seatsPos }}</span></div>
        <p class="text-center namearea text-nowrap" :style="{ 'font-size': fontSizeC + 'em' }"><span v-show="showNumber">{{ photoNo }}&nbsp;</span><span v-show="showName">{{ photoName }}</span></p>
    </div>

    <div v-if="shareText" @click="shareText = null" class="floating-qrcode card p-0 m-0">
        <span class="close">✕</span>
        <qrcode-vue class="responsive-qr" render-as="svg" :value="shareText" :size="400" level="H"></qrcode-vue>
    </div>

    <footer class="d-print-none text-end">
        <a href="https://github.com/tyroneyeh/SeatingChart/" target="_blank" rel="noopener noreferrer">
            <img src="https://img.shields.io/github/last-commit/tyroneyeh/SeatingChart?logo=github" alt="GitHub last commit" />
            <img src="https://data.jsdelivr.com/v1/package/gh/tyroneyeh/SeatingChart/badge?style=rounded" alt="JSDelivr CDN" class="jsdelivr-badge" />
        </a>
    </footer>
</template>

<script>
import { ref, reactive, computed, nextTick, onMounted, onUnmounted, watch } from 'vue';
import { fonts } from './data/fonts';
import { gzipBase64UrlBC, ungzipBase64UrlBC } from './utils/compression';
import { IDBHelper } from './utils/idb';
import { currentLanguage, translate } from './utils/i18n';

const loadedFonts = new Set();

function goHome() {
    const currentOrigin = location.origin;
    const currentPathname = location.pathname;
    location.href = `${currentOrigin}${currentPathname}`;
}

function setFonts(newVal) {
    const f = fonts.find((e) => e.family == newVal);
    if (f) {
        if (!loadedFonts.has(f.family) && 'FontFace' in globalThis) {
            const fontFace = new FontFace(f.family, `url("${f.file}") format("truetype")`, {
                weight: 'normal',
                style: 'normal'
            });
            fontFace
                .load()
                .then((loaded) => {
                    document.fonts.add(loaded);
                    loadedFonts.add(f.family);
                })
                .catch((err) => {
                    console.error('Failed to load font:', f.family, err);
                });
        }
        document.documentElement.style.setProperty('--custom-font', `"${f.family}"`);
        localStorage.setItem('showFonts', newVal);
    } else {
        document.documentElement.style.removeProperty('--custom-font');
        localStorage.removeItem('showFonts');
    }
    return newVal;
}

function getCookie(name) {
    const value = '; ' + document.cookie;
    const parts = value.split(`; ${name}=`);
    if (parts.length == 2) return parts.pop().split(';').shift();
}

function setCookie(name, value, age) {
    age = undefined == age ? 60 * 60 * 24 * 14 : age;
    const secure = location.protocol === 'https:' ? '; Secure' : '';
    document.cookie = `${name}=${value}; path=${location.pathname}; max-age=${age}; SameSite=Lax${secure}`;
}

function splitTextWithSpecialCaseSimple(text) {
    if (!text) return [];

    const isChinese = (ch) => /[\u4e00-\u9fa5]/.test(ch);
    const textRe = isChinese(text[0]) ? /[ 　\n\t,，、]+/ : /\n/;
    const textSegments = text.includes('\n')
        ? text.split('\n').filter((segment) => segment.length > 0)
        : text.split(textRe).filter((segment) => segment.length > 0);
    const cleanedSegments = [];

    for (const segment of textSegments) {
        if (segment.length > 0) {
            cleanedSegments.push(segment);
        }
    }
    let i = 0;
    const result = [];
    while (i < cleanedSegments.length) {
        if (i + 1 < cleanedSegments.length && cleanedSegments[i].length == 1 && cleanedSegments[i + 1].length == 1) {
            result.push(`${cleanedSegments[i]} ${cleanedSegments[i + 1]}`);
            i += 2;
        } else {
            result.push(cleanedSegments[i]);
            i++;
        }
    }

    return result.filter((segment) => segment.replace(/\s/g, '').length >= 2);
}

function swapElements(arr, idx1, idx2) {
    const val1 = parseInt(arr[idx1]?.innerText || '');
    const val2 = parseInt(arr[idx2]?.innerText || '');

    if (arr[idx1]) arr[idx1].innerText = val2 || '';
    if (arr[idx2]) arr[idx2].innerText = val1 || '';
}

function setElementValue(arr, idx, value) {
    if (arr[idx]) arr[idx].innerText = value || '';
}

function setTitle(event) {
    event.currentTarget.title = event.currentTarget.innerText;
}

export default {
    name: 'App',
    setup() {
        let oldValue = null;
        let hideOptionTimer = null;
        let jsondata = null;
        let dkeys = null;
        let startEditing = false;
        let dropData = null;
        let pasteDataLength = 0;

        async function loadData() {
            const params = new URLSearchParams(location.hash.substring(1));
            if (params.has('data')) {
                try {
                    jsondata = await ungzipBase64UrlBC(params.get('data'));
                } catch (e) {
                    console.log(e);
                }
            } else {
                jsondata = localStorage.getItem('data');
            }

            if (jsondata) {
                try {
                    const data = JSON.parse(jsondata);

                    if (data.colors && data.posdata && data.colors.length != data.posdata.length) {
                        const oldLen = data.colors.length;
                        data.colors.length = data.posdata.length;
                        data.colors.fill(0, oldLen);
                    }

                    dkeys = Object.entries(data);
                } catch (e) {
                    console.error(e);
                }
            }
        }

        function toggleNavBarCtl() {
            refs.toggleNavbar.value = !refs.toggleNavbar.value;
            refs.toggleNavbar.value ? localStorage.setItem('toggleNavbar', 1) : localStorage.removeItem('toggleNavbar');
        }

        function triggerUpload() {
            refs.uploadfile.value?.click();
        }

        function tipsToHide() {
            refs.hideTips.value = true;
            setCookie('hideTips', 1);
        }

        function getNameByNumber(num) {
            const nameListEntry = storeRefs.namelist?.[num - 1];
            return nameListEntry ? nameListEntry.innerText : '';
        }

        function setNameText(targetArr, index, num) {
            const name = getNameByNumber(num);
            if (targetArr[index]) {
                targetArr[index].innerText = name;
            }
        }

        function updateDisplay(o, num, pos) {
            if (storeRefs.totalX.value > 1 && storeRefs.totalY.value > 1) {
                refs.totalnums.value = storeRefs.totalX.value * storeRefs.totalY.value;
            }

            refs.clearBtnCtl.value = storeRefs.posdata.every((i) => i.innerText.trim() == '');

            if (o == 'posdata' && num) {
                setNameText(refs.posname, pos, num);
                if (!refs.nameBgCtlChecked.value.includes(num)) refs.nameBgCtlChecked.value.push(num);
            } else if (o == 'leaders' && num) {
                setNameText(refs.leadersname, pos - 1, num);
            } else if (!o) {
                storeRefs.posdata.forEach((item, j) => {
                    if (refs.posname[j]) refs.posname[j].innerText = '';
                    const sNum = parseInt(item.innerText.trim());
                    if (!isNaN(sNum)) {
                        setNameText(refs.posname, j, sNum);
                        if (!refs.nameBgCtlChecked.value.includes(sNum)) refs.nameBgCtlChecked.value.push(sNum);
                    }
                });

                storeRefs.leaders.forEach((item, j) => {
                    const sNum = parseInt(item.innerText.trim());
                    if (!isNaN(sNum)) {
                        setNameText(refs.leadersname, j, sNum);
                    }
                });
            }
        }

        function store(o) {
            const datakeys = Object.keys(storeRefs);

            if (!storeRefs.namelist.filter((i) => i.innerText.trim().length).length && storeRefs.totalX.value > 1 && storeRefs.totalY.value > 1) {
                storeRefs.totalNamelist.value = storeRefs.totalX.value * storeRefs.totalY.value;
            }

            if (o !== 'today' && storeRefs.today.value) {
                storeRefs.today.value.innerText = new Date().toLocaleDateString();
            }

            const dataToSave = {};

            datakeys.forEach((key) => {
                const refVal = storeRefs[key];

                if (key == 'tabletitle') {
                    dataToSave[key] = refVal.value.innerText;
                    document.title = refVal.value.innerText + ' - ' + translate('TY Seating Chart');
                } else if (Array.isArray(refVal)) {
                    dataToSave[key] = refVal.map((item) => item && item.innerText);
                } else if (refVal.value && undefined != refVal.value?.innerText) {
                    dataToSave[key] = refVal.value.innerText;
                } else if (refVal.value) {
                    dataToSave[key] = refVal.value;
                }
            });

            jsondata = JSON.stringify(dataToSave);
            localStorage.setItem('data', jsondata);
            refs.storeData.value = 1;
        }

        function endEdit(e, o, num, pos) {
            startEditing = false;
            if (o == 'posdata') {
                const excludePos = storeRefs.posdata.map((el) => el?.innerText ?? '');
                excludePos[pos] = '';
                const alreadyInPos = excludePos.findIndex((el) => el == num);
                const oldPosValue = excludePos[pos];
                if (alreadyInPos > -1) {
                    storeRefs.posdata[alreadyInPos].innerText = oldPosValue;
                    refs.posname[alreadyInPos].innerText = '';
                }
            }
            updateDisplay(o, num, pos);

            e?.target?.removeAttribute('contenteditable');
            refs.editingEl.value = null;
            if (e?.target?.innerText !== oldValue) {
                store(o);
            }
            oldValue = null;
        }

        function startEdit(el) {
            startEditing = true;
            refs.editingEl.value?.removeAttribute('contenteditable');
            if (!el) return;
            el.setAttribute('contenteditable', 'true');
            refs.editingEl.value = el;
            nextTick(() => el.focus());

            oldValue = el.innerText;

            const text = el.innerText.trim();
            if (text.length) {
                speakText(text.replaceAll(/\s/g, ','));
            }
        }

        function focusAtEnd(el) {
            if (!el) return;
            el.focus();
            const range = document.createRange();
            range.selectNodeContents(el);
            range.collapse(false);
            const sel = globalThis.getSelection();
            sel.removeAllRanges();
            sel.addRange(range);
        }

        async function editKeydown(e, o, n) {
            const key = e.key;

            if (o == 'namelist') {
                if (n == storeRefs.totalNamelist.value && (key == 'Enter' || key == 'ArrowDown')) {
                    e.preventDefault();
                    storeRefs.totalNamelist.value++;
                    await nextTick();
                    startEdit(storeRefs.namelist[storeRefs.totalNamelist.value - 1]);
                } else if (n == storeRefs.totalNamelist.value && key == 'Backspace') {
                    if (storeRefs.namelist[storeRefs.totalNamelist.value - 1].innerText.trim().length) return;
                    e.preventDefault();
                    storeRefs.totalNamelist.value > 1 && storeRefs.totalNamelist.value--;
                    startEdit(storeRefs.namelist[storeRefs.totalNamelist.value - 1]);
                    focusAtEnd(storeRefs.namelist[storeRefs.totalNamelist.value - 1]);
                } else if (key == 'ArrowUp') {
                    e.preventDefault();
                    startEdit(storeRefs.namelist[n - 2]);
                } else if (key == 'ArrowDown' || key == 'Enter') {
                    e.preventDefault();
                    startEdit(storeRefs.namelist[n]);
                }
            } else if (o == 'leadernames') {
                if (n == storeRefs.totalLeader.value && (key == 'Enter' || key == 'ArrowDown')) {
                    e.preventDefault();
                    storeRefs.totalLeader.value++;
                    await nextTick();
                    startEdit(storeRefs.leadernames[storeRefs.totalLeader.value - 1]);
                } else if (n == storeRefs.totalLeader.value && key == 'Backspace') {
                    if (storeRefs.leadernames[storeRefs.totalLeader.value - 1].innerText.trim().length) return;
                    e.preventDefault();
                    storeRefs.totalLeader.value > 1 && storeRefs.totalLeader.value--;
                    startEdit(storeRefs.leadernames[storeRefs.totalLeader.value - 1]);
                    focusAtEnd(storeRefs.leadernames[storeRefs.totalLeader.value - 1]);
                } else if (key == 'ArrowUp') {
                    e.preventDefault();
                    startEdit(storeRefs.leadernames[n - 2]);
                    focusAtEnd(storeRefs.leadernames[n - 2]);
                } else if (key == 'ArrowDown' || key == 'Enter') {
                    e.preventDefault();
                    startEdit(storeRefs.leadernames[n]);
                    focusAtEnd(storeRefs.leadernames[n]);
                }
            } else if (o == 'posdata') {
                if (key == 'ArrowUp') {
                    e.preventDefault();
                    startEdit(storeRefs.posdata[n - storeRefs.totalX.value]);
                    focusAtEnd(storeRefs.posdata[n - storeRefs.totalX.value]);
                } else if (key == 'ArrowDown') {
                    e.preventDefault();
                    startEdit(storeRefs.posdata[n + storeRefs.totalX.value]);
                    focusAtEnd(storeRefs.posdata[n + storeRefs.totalX.value]);
                } else if (key == 'ArrowLeft' || key == 'Backspace') {
                    const hasText = storeRefs.posdata[n].innerText.trim().length;
                    if (hasText && key == 'Backspace') return;
                    if (!hasText) refs.posname[n].innerText = '';
                    e.preventDefault();
                    startEdit(storeRefs.posdata[n - 1]);
                    focusAtEnd(storeRefs.posdata[n - 1]);
                } else if (key == 'ArrowRight' || key == 'Enter') {
                    e.preventDefault();
                    startEdit(storeRefs.posdata[n + 1]);
                    focusAtEnd(storeRefs.posdata[n + 1]);
                }
            } else if (o == 'leaders') {
                if (key == 'ArrowUp' || key == 'Backspace') {
                    const hasText = storeRefs.leaders[n - 1].innerText.trim().length;
                    if (hasText && key == 'Backspace') return;
                    if (!hasText) refs.leadersname[n - 1].innerText = '';
                    e.preventDefault();
                    startEdit(storeRefs.leaders[n - 2]);
                    focusAtEnd(storeRefs.leaders[n - 2]);
                } else if (key == 'ArrowDown' || key == 'Enter') {
                    e.preventDefault();
                    startEdit(storeRefs.leaders[n]);
                }
            } else if (o == 'nameBgCtl') {
                if (key == 'ArrowUp') {
                    e.preventDefault();
                    refs.nameBgCtl[n - 2]?.focus();
                } else if (key == 'ArrowDown') {
                    e.preventDefault();
                    refs.nameBgCtl[n]?.focus();
                } else if (key == 'Enter') {
                    e.preventDefault();
                    const currentIndex = refs.nameBgCtlChecked.value.indexOf(n);
                    if (currentIndex === -1) {
                        refs.nameBgCtlChecked.value.push(n);
                    } else {
                        refs.nameBgCtlChecked.value.splice(currentIndex, 1);
                    }
                }
            }
        }

        function convertPhotoToIndexedDB(photoItem, n) {
            let j = 0;
            for (const item of photoItem) {
                if (refs.nameBgCtl.length < n + j || n + j == 0 || isNaN(n)) return;
                const file = item.getAsFile ? item.getAsFile() : item;
                const reader = new FileReader();
                reader.onload = (event) => {
                    const img = new Image();
                    img.src = event.target.result;
                    img.onload = () => {
                        const canvas = document.createElement('canvas');
                        const targetHeight = (img.height * 200) / img.width;
                        canvas.width = 200;
                        canvas.height = targetHeight;
                        const ctx = canvas.getContext('2d');
                        ctx.imageSmoothingEnabled = true;
                        ctx.imageSmoothingQuality = 'high';
                        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                        const num = n + j;
                        const dataUrl = canvas.toDataURL('image/png');
                        IDBHelper.put('photo', dataUrl, num);
                        refs.photos[num] = dataUrl;
                        j++;
                    };
                };
                reader.readAsDataURL(file);
            }
        }

        async function editPaste(e, o, n) {
            const clipboardText = e?.clipboardData?.getData('text')?.trim() || '';
            const photoItem = e?.clipboardData?.items
                ? Array.from(e.clipboardData.items).filter((i) => i.type.includes('image'))
                : null;

            let text = clipboardText || dropData?.trim() || '';
            dropData = null;

            if (!text && (!photoItem || !photoItem.length)) {
                try {
                    text = (await navigator.clipboard.readText())?.trim() || '';
                } catch {
                    text = '';
                }
            }

            const pasteData = splitTextWithSpecialCaseSimple(text);
            if (!['namelist', 'leadernames'].includes(o) || (!pasteData?.length && !photoItem?.length)) return;

            if (pasteData.length) e?.preventDefault();

            if (!pasteData.length && 'namelist' == o && photoItem?.length) {
                await convertPhotoToIndexedDB(photoItem, n);
                return;
            }

            const list = storeRefs[o];
            const startIndex = n - 1;

            pasteDataLength = pasteData.length;

            storeRefs.totalNamelist.value = Math.max(pasteData.length + startIndex, storeRefs.totalNamelist.value || 0);
            await nextTick();
            pasteData.forEach((segment, j) => {
                const item = list[startIndex + j];
                if (item) {
                    item.innerText = segment.replace(/(['"])(.*?)\1/g, '$2').replaceAll(',', '').trim();
                }
            });

            randomPos();
        }

        function clearStore() {
            if (!confirm(translate('Are you sure you want to clear all entered data?'))) return;
            localStorage.removeItem('data');
            IDBHelper.remove('photo');
            goHome();
        }

        function clearPhotos() {
            if (!confirm(translate('Are you sure you want to clear all photos?'))) return;
            localStorage.removeItem('showPhoto');
            IDBHelper.remove('photo');
            goHome();
        }

        function clearColors() {
            refs.toggleSubmenu.value = false;
            storeRefs.colors.value.fill(0);
            store();
        }

        async function download() {
            refs.toggleSubmenu.value = false;
            if (!jsondata) return;
            const dataObj = JSON.parse(jsondata);
            dataObj.photo = await IDBHelper.get('photo');
            const data = JSON.stringify(dataObj);

            if (data) {
                const blob = new Blob([data], { type: 'application/json;charset=utf-8' });
                const url = URL.createObjectURL(blob);
                const dlAnchorElem = document.createElement('a');
                dlAnchorElem.href = url;
                dlAnchorElem.download =
                    (storeRefs.tabletitle.value.innerText.trim() || translate('Seating charts')) +
                    `_${storeRefs.today.value.innerText}.json`;
                document.body.appendChild(dlAnchorElem);
                dlAnchorElem.click();
                dlAnchorElem.remove();
                URL.revokeObjectURL(url);
            }
        }

        function randomPos() {
            refs.toggleSubmenu.value = false;
            let rNum, i, studentNums;
            for (i = storeRefs.totalNamelist.value; i > 0; i--) {
                if (storeRefs.namelist[i - 1]?.innerText.trim().length) break;
            }

            const checkedNames = refs.nameBgCtl.filter((c) => c.value != '');
            studentNums = checkedNames.length
                ? checkedNames.map((c) => +c.value)
                : Array.from({ length: i }, (_, index) => index + 1);

            const alreadyInPos = new Set(storeRefs.posdata.filter((el) => el.innerText != '').map((el) => +el.innerText));

            if (refs.nameBgCtlChecked.value.length != storeRefs.namelist.filter((c) => c.innerText != '').length) {
                studentNums = studentNums.filter((num) => !alreadyInPos.has(num));
            } else if (alreadyInPos.size == studentNums.length && !resetPos()) return;

            const posdatas = storeRefs.posdata.slice().reverse();
            for (const element of posdatas) {
                if (!element.innerText.trim().length) {
                    rNum = Math.floor(Math.random() * studentNums.length);
                    if (storeRefs.namelist[studentNums[rNum] - 1]?.innerText.trim().length) {
                        element.innerText = studentNums[rNum];
                    } else {
                        continue;
                    }

                    studentNums.splice(rNum, 1);
                    if (!studentNums.length) break;
                }
            }

            updateDisplay();
            store();
        }

        function resetPos() {
            refs.toggleSubmenu.value = false;
            storeRefs.posdata.forEach((i) => (i.innerText = ''));
            refs.posname.forEach((i) => (i.innerText = ''));
            refs.nameBgCtlChecked.value = [];
            store();
            return 1;
        }

        async function shareData() {
            refs.toggleSubmenu.value = false;
            if (jsondata) {
                const { photo, ...data } = JSON.parse(jsondata);
                const zipData = await gzipBase64UrlBC(data);
                const url = new URL(location.href);
                url.hash = `data=${zipData}`;
                if (navigator.share) {
                    try {
                        await navigator.share({
                            title: translate('TY Seating Chart'),
                            text: storeRefs.tabletitle.value.innerText.trim() || translate('Seating charts'),
                            url: url.toString()
                        });
                    } catch {
                        // user cancelled share
                    }
                } else {
                    refs.shareText.value = url.toString();
                    await navigator.clipboard.writeText(url.toString());
                }
            }
        }

        function uploadfileChange(e) {
            refs.toggleSubmenu.value = false;
            const fileInput = e.target.files?.[0];
            if (!fileInput) return;
            const reader = new FileReader();
            reader.readAsText(fileInput, 'UTF-8');
            reader.onload = (event) => {
                if (!event.target?.result) return;
                const data = JSON.parse(event.target.result);
                if (data.photo) {
                    for (const photos of data.photo) {
                        for (const [key, value] of Object.entries(photos)) {
                            IDBHelper.put('photo', value, parseInt(key));
                        }
                    }
                    delete data.photo;
                }
                localStorage.setItem('data', JSON.stringify(data));
                goHome();
            };
            e.target.value = '';
        }

        function speakText(text) {
            if (!refs.speechVoice.value) return;
            if (!text || !('speechSynthesis' in globalThis) || speechSynthesis.speaking) {
                return;
            }
            speechSynthesis.speak(new SpeechSynthesisUtterance(text));
        }

        function doSpeak(n) {
            if (!refs.speechVoice.value) return;
            const name = storeRefs.namelist[n - 1]?.innerText.trim();
            if (name) {
                const numberText = currentLanguage.value.includes('en')
                    ? `${translate('Number')} ${n}`
                    : `${n}${translate('Number')}`;
                speakText(`${numberText}, ${name}`);
            }
        }

        function showPos(n, show) {
            n && (refs.highlightedPos.value = show ? n : null);
        }

        function dragStart(e, type, index) {
            e.dataTransfer.setData('text/plain', JSON.stringify({ type, index }));
            e.target.classList?.add('dragging', `${type}-row`);
            refs.draggingPos.value = `${type}-${index}`;
        }

        async function drop(e, targetIndex) {
            e.preventDefault();
            e.stopPropagation();

            if (!e.dataTransfer) return;

            let data = e.dataTransfer.getData('text/plain');
            if (
                !(globalThis.getSelection().rangeCount && !globalThis.getSelection().getRangeAt(0).collapsed) &&
                data.split('').filter((c) => /[,\s]/.test(c)).length > 1
            ) {
                dropData = data;
                await editPaste(null, 'namelist', 1);
                storeRefs.totalNamelist.value = pasteDataLength;
                return;
            }

            let isNamelistRow = e.currentTarget.closest?.('table')?.classList.contains('namelist');
            const isLeaderRow = e.currentTarget.classList?.contains('leader-row');
            const isSeatRow = e.currentTarget.classList?.contains('seat-row');

            if (e.currentTarget == document.body) isNamelistRow = true;

            if (e.dataTransfer.files.length && !isLeaderRow) {
                if (typeof targetIndex != 'number') targetIndex = 1;
                return convertPhotoToIndexedDB(
                    e.dataTransfer.files,
                    isSeatRow ? parseInt(storeRefs.posdata[targetIndex].innerText) : targetIndex
                );
            }

            try {
                data = JSON.parse(data);
            } catch (err) {
                console.log(err);
                return;
            }

            let isVaild = false;
            const sourceIndex = parseInt(data.index);

            const actions = [
                {
                    condition: () => data.type == 'student' && isSeatRow,
                    action: () => {
                        if (sourceIndex < 1 || sourceIndex > storeRefs.totalNamelist.value) return;
                        const targetElement = storeRefs.posdata.find((el) => el.innerText.trim() == sourceIndex);
                        const oldValueText = storeRefs.posdata[targetIndex].innerText;
                        if (targetElement) {
                            storeRefs.posdata[targetIndex].innerText = targetElement.innerText;
                            targetElement.innerText = oldValueText;
                        }
                        setElementValue(storeRefs.posdata, targetIndex, sourceIndex);
                        isVaild = true;
                    }
                },
                {
                    condition: () => data.type == 'seat' && isSeatRow,
                    action: () => {
                        if (sourceIndex == targetIndex) return;
                        swapElements(storeRefs.posdata, sourceIndex, targetIndex);
                        isVaild = true;
                    }
                },
                {
                    condition: () => data.type == 'seat' && isLeaderRow,
                    action: () => {
                        const sourceNum = parseInt(storeRefs.posdata[sourceIndex]?.innerText || '');
                        setElementValue(storeRefs.leaders, targetIndex, sourceNum);
                        isVaild = true;
                    }
                },
                {
                    condition: () => data.type == 'seat' && isNamelistRow,
                    action: () => {
                        const sourceNum = parseInt(storeRefs.posdata[sourceIndex]?.innerText || '');
                        refs.nameBgCtlChecked.value = refs.nameBgCtlChecked.value.filter((num) => num != sourceNum);
                        setElementValue(storeRefs.posdata, sourceIndex, '');
                        isVaild = true;
                    }
                },
                {
                    condition: () => data.type == 'leader' && isLeaderRow,
                    action: () => {
                        if (sourceIndex == targetIndex) return;
                        swapElements(storeRefs.leaders, sourceIndex, targetIndex);
                        if (!storeRefs.leaders[sourceIndex]?.innerText.trim().length) {
                            setElementValue(refs.leadersname, sourceIndex, '');
                        }
                        isVaild = true;
                    }
                },
                {
                    condition: () => data.type == 'student' && isLeaderRow,
                    action: () => {
                        if (sourceIndex < 1 || sourceIndex > storeRefs.totalNamelist.value) return;
                        setElementValue(storeRefs.leaders, targetIndex, sourceIndex);
                        isVaild = true;
                    }
                }
            ];

            for (const { condition, action } of actions) {
                if (condition()) {
                    action();
                    break;
                }
            }

            refs.draggingPos.value = null;

            if (!isVaild) return;
            store();
            updateDisplay();
        }

        const backgroundColor = (index) => {
            if (index > 0) {
                return `hsl(${index * (360 / 48)}, 70%, 85%)`;
            }
            return '';
        };

        const toggleColor = (event, index) => {
            const el = event.currentTarget;

            if (index != undefined) {
                storeRefs.colors.value[index] = refs.colorIndex.value - 1;
                store();
                return;
            }
            if (refs.colorIndex.value > 1) {
                el.style.backgroundColor = backgroundColor(refs.colorIndex.value - 1);
                return;
            }
            el.style.backgroundColor = '';
        };

        const fontSizeMap = {
            r: 'fontSizeR',
            c: 'fontSizeC',
            l: 'fontSizeL'
        };

        async function adujstFont(direction) {
            const key = fontSizeMap[refs.fontPos.value];
            if (key) {
                const val = storeRefs[key].value + (direction == '+' ? 0.1 : -0.1);
                if (val >= 0.5) {
                    storeRefs[key].value = Math.round(val * 10) / 10;
                    store();
                }
            }
        }

        const fontButtonCtl = computed(() => {
            const key = fontSizeMap[refs.fontPos.value];
            return storeRefs[key].value <= 0.5;
        });

        const hasValidColors = computed(() => {
            if (!storeRefs.colors.value) return false;
            return storeRefs.colors.value.some((item) => item != 0);
        });

        function nameBtnCtlChange(e) {
            refs.nameBgCtlChecked.value = e.target.checked
                ? refs.nameBgCtl.filter((c) => c.value != '').map((c) => +c.value)
                : [];
        }

        function binGo() {
            refs.bingoButtonCtl.value = true;
            refs.doBingo.value = true;
            let arr = storeRefs.posdata.map((i) => Number(i.innerText)).filter(Boolean);

            if (refs.nameBgCtlChecked.value.length < 1) {
                refs.nameBtnCtl.value.checked = true;
                refs.nameBgCtlChecked.value = arr;
            } else {
                arr = arr.filter((i) => refs.nameBgCtlChecked.value.includes(i));
            }

            const finalNumber = Math.floor(Math.random() * arr.length);
            let current = 0;

            const getDelay = (i, arrLength) => {
                const t = i / arrLength;
                const minDelay = 50;
                const maxDelay = 200;

                if (t < 0.3) {
                    return maxDelay - (maxDelay - minDelay) * (t / 0.3);
                } else if (t < 0.7) {
                    return minDelay;
                } else if (t <= 0.9) {
                    return maxDelay - (maxDelay - minDelay) * ((t - 0.7) / 0.3) ** 2;
                }
                return maxDelay - (maxDelay - minDelay) * ((t - 0.7) / 0.3) ** 20;
            };

            function roll(i) {
                current = (current % arr.length) + 1;
                showPos(arr[current - 1], 1);
                tipPhoto(arr[current - 1]);

                if (i < arr.length) {
                    setTimeout(() => roll(i + 1), getDelay(i, arr.length));
                } else {
                    showPos(arr[finalNumber], 1);
                    tipPhoto(arr[finalNumber]);
                    refs.nameBgCtlChecked.value = refs.nameBgCtlChecked.value.filter((n) => n != arr[finalNumber]);
                    refs.bingoButtonCtl.value = false;
                    doSpeak(arr[finalNumber]);
                }
            }

            roll(0);
        }

        async function tipPhoto(n) {
            if (!n) return;

            refs.photo.value = await IDBHelper.get('photo', n);

            const numPos = storeRefs.posdata.findIndex((i) => i.innerText == n);
            const row = (numPos % storeRefs.totalX.value) + 1;
            const column = storeRefs.totalY.value - Math.floor(numPos / storeRefs.totalX.value);
            refs.seatsPos.value = `${row}-${column}`;
            refs.photoNo.value = n;
            refs.photoName.value = storeRefs.namelist[n - 1]?.innerText || '';
        }

        function indexPos(x, y) {
            return (y - 1) * storeRefs.totalX.value + (x - 1);
        }

        function print() {
            refs.toggleSubmenu.value = false;
            window.print();
        }

        function startHideOptionMenu() {
            hideOptionTimer = setTimeout(() => {
                refs.toggleOptionmenu.value = false;
            }, 1000);
        }

        function keepMenuOptionOpen() {
            if (hideOptionTimer) {
                clearTimeout(hideOptionTimer);
                hideOptionTimer = null;
            }
        }

        const storeRefs = {
            tabletitle: ref(translate('Seating charts')),
            today: ref(new Date().toLocaleDateString()),
            totalX: ref(6),
            totalY: ref(8),
            totalNamelist: ref(48),
            totalLeader: ref(8),
            namelist: reactive([]),
            posdata: reactive([]),
            teacher: ref(null),
            leadernames: reactive([]),
            leaders: reactive([]),
            deskname: ref(translate('Desk')),
            updateLabel: ref(translate('Update')),
            teacherLabel: ref(translate('Teacher')),
            studentListLabel: ref(translate('Lists')),
            noteLabel: ref(translate('Note')),
            note: ref(''),
            fontSizeL: ref(1),
            fontSizeC: ref(1.8),
            fontSizeR: ref(1.2),
            colors: ref([])
        };

        const refs = {
            uploadfile: ref(null),
            toggleNavbar: ref(localStorage.getItem('toggleNavbar') == 1),
            toggleSubmenu: ref(false),
            toggleOptionmenu: ref(false),
            totalnums: ref(48),
            storeData: ref(0),
            posname: reactive([]),
            posindex: ref(0),
            leadersname: reactive([]),
            clearBtnCtl: ref(0),
            isDataChanged: ref(0),
            nameBgCtlChecked: ref([]),
            nameBgCtl: reactive([]),
            hideTips: ref(false),
            highlightedPos: ref(null),
            draggingPos: ref(null),
            colorIndex: ref(-1),
            currentTarget: ref(null),
            currentIndex: ref(0),
            showList: ref(localStorage.getItem('showList') == null),
            showTitle: ref(localStorage.getItem('showTitle') == null),
            showSeats: ref(localStorage.getItem('showSeats') == null),
            showNumber: ref(localStorage.getItem('showNumber') == null),
            showPlace: ref(localStorage.getItem('showPlace') == null),
            showName: ref(localStorage.getItem('showName') == null),
            showLeader: ref(localStorage.getItem('showLeader') == null),
            showNote: ref(localStorage.getItem('showNote') == null),
            showVertical: ref(localStorage.getItem('showVertical') == null),
            showFonts: ref(setFonts(localStorage.getItem('showFonts')) || ''),
            speechVoice: ref(localStorage.getItem('speechVoice') == null || ''),
            showDate: ref(localStorage.getItem('showDate') == null),
            showDesk: ref(localStorage.getItem('showDesk') == null),
            showPhoto: ref(localStorage.getItem('showPhoto') != null),
            onlyPhoto: ref(localStorage.getItem('onlyPhoto') != null),
            deskPos: ref(localStorage.getItem('deskPos') != null),
            fontPos: ref('c'),
            nameBtnCtl: ref(false),
            editingEl: ref(null),
            bingoButtonCtl: ref(false),
            photo: ref(null),
            seatsPos: ref(''),
            photoNo: ref(''),
            photoName: ref(''),
            doBingo: ref(false),
            storeSelected: ref(''),
            shareText: ref(null),
            fonts: reactive(fonts),
            photos: reactive([])
        };

        watch(refs.showList, (newVal) => {
            newVal ? localStorage.removeItem('showList') : localStorage.setItem('showList', 0);
        });
        watch(refs.showTitle, (newVal) => {
            newVal ? localStorage.removeItem('showTitle') : localStorage.setItem('showTitle', 0);
        });
        watch(refs.showSeats, (newVal) => {
            newVal ? localStorage.removeItem('showSeats') : localStorage.setItem('showSeats', 0);
        });
        watch(refs.showNumber, (newVal) => {
            newVal ? localStorage.removeItem('showNumber') : localStorage.setItem('showNumber', 0);
        });
        watch(refs.showPlace, (newVal) => {
            newVal ? localStorage.removeItem('showPlace') : localStorage.setItem('showPlace', 0);
        });
        watch(refs.showName, (newVal) => {
            newVal ? localStorage.removeItem('showName') : localStorage.setItem('showName', 0);
        });
        watch(refs.showLeader, (newVal) => {
            newVal ? localStorage.removeItem('showLeader') : localStorage.setItem('showLeader', 0);
        });
        watch(refs.showNote, (newVal) => {
            newVal ? localStorage.removeItem('showNote') : localStorage.setItem('showNote', 0);
        });
        watch(refs.showVertical, (newVal) => {
            newVal ? localStorage.removeItem('showVertical') : localStorage.setItem('showVertical', 0);
        });
        watch(refs.showFonts, (newVal) => {
            setFonts(newVal);
        });
        watch(refs.speechVoice, (newVal) => {
            newVal ? localStorage.removeItem('speechVoice') : localStorage.setItem('speechVoice', 0);
        });
        watch(refs.showDate, (newVal) => {
            newVal ? localStorage.removeItem('showDate') : localStorage.setItem('showDate', 0);
        });
        watch(refs.showDesk, (newVal) => {
            newVal ? localStorage.removeItem('showDesk') : localStorage.setItem('showDesk', 0);
        });
        watch(refs.showPhoto, async (newVal) => {
            newVal ? localStorage.setItem('showPhoto', 1) : localStorage.removeItem('showPhoto');
            if (newVal && !refs.photos.length) {
                const photos = await IDBHelper.getAll('photo');
                for (const [key, value] of photos) {
                    refs.photos[key] = value;
                }
            }
        });
        watch(refs.onlyPhoto, (newVal) => {
            newVal ? localStorage.setItem('onlyPhoto', 1) : localStorage.removeItem('onlyPhoto');
        });
        watch(refs.deskPos, (newVal) => {
            newVal ? localStorage.setItem('deskPos', 1) : localStorage.removeItem('deskPos');
        });
        watch([storeRefs.totalX, storeRefs.totalY], () => {
            const newSize = storeRefs.totalX.value * storeRefs.totalY.value;
            storeRefs.posdata.length = newSize;
            refs.posname.length = newSize;
        });

        const handleBodyDragOver = (e) => e.preventDefault();
        const handleBodyDrop = (e) => drop(e);
        const handleGlobalPaste = (e) => !startEditing && editPaste(e, 'namelist', 1);
        const handleBeforePrint = () => {
            refs.toggleSubmenu.value = false;
            const el = document.getElementById('print-area');
            if (!el) return;

            const A4_HEIGHT_PX = 1122;
            const contentHeight = el.offsetHeight + 120;
            const scale = contentHeight > A4_HEIGHT_PX ? A4_HEIGHT_PX / contentHeight : 1;
            el.style.zoom = scale;
        };
        const resetPrintLayout = () => {
            const el = document.getElementById('print-area');
            if (el && el.style.zoom !== '') {
                el.style.zoom = '';
                const originalDisplay = el.style.display;
                el.style.display = 'none';
                el.getBoundingClientRect();
                el.style.display = originalDisplay;
            }
        };
        const handlePrintMediaChange = (mql) => {
            if (!mql.matches) {
                resetPrintLayout();
            }
        };
        let printMediaQuery = null;

        onMounted(async () => {
            await loadData();
            refs.storeData.value = dkeys ? 1 : 0;

            if (storeRefs.leadernames) {
                if (storeRefs.leadernames[0] && !storeRefs.leadernames[0].innerText.length) {
                    storeRefs.leadernames[0].innerText = translate('President');
                }
                if (storeRefs.leadernames[1] && !storeRefs.leadernames[1].innerText.length) {
                    storeRefs.leadernames[1].innerText = translate('Vice president');
                }
            }
            if (!refs.storeData.value && currentLanguage.value == 'en') {
                refs.showVertical.value = false;
            }
            if (refs.storeData.value) {
                tipsToHide();
            }

            const typeMap = {
                totalNamelist: Number,
                totalX: Number,
                totalY: Number,
                totalLeader: Number,
                fontSizeR: parseFloat,
                fontSizeC: parseFloat,
                fontSizeL: parseFloat
            };
            for (const [key, value] of dkeys || []) {
                if (key == 'tabletitle') {
                    document.title = value + ' - ' + translate('TY Seating Chart');
                    storeRefs.tabletitle.value.innerText = value;
                } else if (key == 'today') {
                    storeRefs.today.value.innerText = value;
                } else if (key in typeMap) {
                    storeRefs[key].value = typeMap[key](value);
                } else if (key == 'colors') {
                    storeRefs[key].value = value;
                }
            }

            await nextTick();

            refs.hideTips.value = getCookie('hideTips') == 1;

            dkeys?.forEach((i) => {
                if (Array.isArray(i[1]) && i[1][0] != null) {
                    if (i[0] == 'colors') {
                        storeRefs[i[0]].value = i[1];
                    } else {
                        i[1].forEach((_, j) => {
                            if (storeRefs[i[0]] && undefined != storeRefs[i[0]][j]?.innerText) {
                                storeRefs[i[0]][j].innerText = i[1][j] ?? '';
                            }
                        });
                    }
                } else if (undefined != storeRefs[i[0]]?.value?.innerText) {
                    storeRefs[i[0]].value.innerText = i[1] ?? '';
                } else if (undefined != storeRefs[i[0]]?.value) {
                    storeRefs[i[0]].value = i[1];
                }
            });

            await nextTick();
            updateDisplay();

            if ('speechSynthesis' in globalThis) {
                speechSynthesis.speak(new SpeechSynthesisUtterance(''));
            }

            if (storeRefs.today.value.innerText == '') {
                storeRefs.today.value.innerText = new Date().toLocaleDateString();
            }

            document.body.addEventListener('dragover', handleBodyDragOver);
            document.body.addEventListener('drop', handleBodyDrop);
            globalThis.addEventListener('paste', handleGlobalPaste);
            window.addEventListener('beforeprint', handleBeforePrint);
            window.addEventListener('afterprint', resetPrintLayout);
            if (window.matchMedia) {
                printMediaQuery = window.matchMedia('print');
                printMediaQuery.addEventListener('change', handlePrintMediaChange);
            }

            refs.nameBtnCtl.value.checked = Boolean(
                refs.nameBgCtlChecked.value.length == storeRefs.namelist.filter((el) => el.innerText.trim() != '').length
            );

            const photosData = await IDBHelper.getAll('photo');
            if (!photosData?.length) refs.showPhoto.value = false;
            for (const [key, value] of photosData) {
                refs.photos[key] = value;
            }
        });

        onUnmounted(() => {
            document.body.removeEventListener('dragover', handleBodyDragOver);
            document.body.removeEventListener('drop', handleBodyDrop);
            globalThis.removeEventListener('paste', handleGlobalPaste);
            window.removeEventListener('beforeprint', handleBeforePrint);
            window.removeEventListener('afterprint', resetPrintLayout);
            if (printMediaQuery) {
                printMediaQuery.removeEventListener('change', handlePrintMediaChange);
            }
        });

        return {
            ...storeRefs,
            ...refs,
            goHome,
            toggleNavBarCtl,
            triggerUpload,
            startEdit,
            endEdit,
            editKeydown,
            editPaste,
            store,
            clearStore,
            clearPhotos,
            clearColors,
            download,
            randomPos,
            resetPos,
            shareData,
            uploadfileChange,
            updateDisplay,
            tipsToHide,
            getCookie,
            showPos,
            dragStart,
            drop,
            toggleColor,
            adujstFont,
            fontButtonCtl,
            hasValidColors,
            nameBtnCtlChange,
            binGo,
            IDBHelper,
            tipPhoto,
            doSpeak,
            setTitle,
            indexPos,
            print,
            backgroundColor,
            startHideOptionMenu,
            keepMenuOptionOpen
        };
    }
};
</script>

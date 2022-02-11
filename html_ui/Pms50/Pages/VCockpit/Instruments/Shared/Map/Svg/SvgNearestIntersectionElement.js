class SvgNearestIntersectionElement extends SvgWaypointElement {
    id(map) {
        return "nrst-intersection-" + this.icaoNoSpace + "-map-" + map.index;
    }
    class() {
        return "map-nrst-intersection";
    }
    imageFileName() {
        let fName = "";
        if (this.source) {
            fName = this.source.imageFileName();
        }
        if (!fName) {
            fName = "ICON_MAP_INTERSECTION.svg";
        }
        if (BaseInstrument.useSvgImages) {
            return fName;
        }
        return fName.replace(".svg", ".png");
    }
    isMinized(map) {
        if (map.instrument) {
            let r = map.instrument.getDeclutteredRange();
            return r > map.instrument.intersectionMaxRange && r < map.instrument.minimizedIntersectionMaxRange;
        }
    }
}
//# sourceMappingURL=SvgNearestIntersectionElement.js.map
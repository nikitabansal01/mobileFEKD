import * as React from "react";
import Svg, { Rect, Defs, Pattern, Use, Image } from "react-native-svg";
const CalenderSvg = ({ width, height }: { width: number; height: number }) => (
  <Svg
    width={width}
    height={height}
    viewBox="0 0 31 32"
    fill="none"
  >
    <Rect width={31} height={32} fill="url(#pattern0_3722_10280)" />
    <Defs>
      <Pattern
        id="pattern0_3722_10280"
        patternContentUnits="objectBoundingBox"
        width={1}
        height={1}
      >
        <Use
          xlinkHref="#image0_3722_10280"
          transform="matrix(0.01 0 0 0.0096875 0 0.015625)"
        />
      </Pattern>
      <Image
        id="image0_3722_10280"
        width={100}
        height={100}
        xlinkHref="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAAACXBIWXMAAAsTAAALEwEAmpwYAAADvklEQVR4nO2cQU8UMRTHexA9YYJXz6gHD0b0smIM2y4h4WJC+AqcZGlHN3LjOwjhQ3iVbNi+XUkEoyYkeFK88hGEq2jesgsbsugMMu1r+35JE5Kd2X3/95922jdMhWAYhmEYhmEYhmEYhmEYhmEYhmEYhmEYxgnNmcUbIE0dpPkMUh+BMr+jalIf9bQtolZBmXbV3Aapv3pPmnJljtlDzYJuz0jIDHVmCsme0h2mfCdH+WlWmReCGlbpL74TA956if4kqGGVOUy4hxwKavhOCnhughq+EwJsCBsC3EOM957AQ5byn2w2RPlPMBtCIKnAhvhPJCRhiNQHIM3cTqUxKiJjp9IYbVeXnltl9sMwROqDzWlzS0TOxuzyWPfCo2+ImROJYGvZPHlDYhymLqI5s3iTvCEiMYCqbrKBpaqbbGCp6iYbWKq6yw7MKv3xbN6vt30fL1I3BAqujMs+/vx5ghpsSHKG6O3+b1hlPvg+XqTeQ6hCVjfZwFLVTTawVHWTDSxV3WQDS1U32cBS1U02sFR1kw0sVd1FA6NWm7Kp17Ko1aYg9VoWtQQDG0KrNgVcy4oDiGXIigWgqptsYKnqJhtYqrrJBpaqbrKBpaqbbGAl83Z+5To2QY1UDSFL6LWsvHSmlu5aZV6D1G2Q+vvJ7kDdhn+38TM8Rvgm9NLJv7BKPwJpOue/96KGF0Srpp8IX8RqyO7EwggovW6VOc5rxkDJ5hikWcPvEPQNoVmbGgTfBLPKbBU1YkhveY9vXAmXxHZT351YGMFE/q8ZgxeF09lYbIaA0ut5Et2Zyiqgsslcxki96lBAPIaArD/Oe884PSfnPaU1/XLCjYiIDLEFhqr+OQWGLnC6gVnoL31uTmf3itwb+ucVuqfI7I6zLf7wpXoRMBYXfaUbYhqlC8F9bHtdct/5FO8K6a7ASzbEKm2Fow2U93qziQN8qR7f4xaBYZX+Ub4hZt/hRso9UwJrzd7eu1bpn8OmtpfNybApMf6GcAUufnAfW9w6NaSdSpt/MQSTetl8tKv6qVdDQsc6GLKwMuxXZUBYZaB8Q0zLr8qAsA6mvVbpV35VBoRV9fEoFoYxAQUeRJ2eQ610EhOt2tIDkPpX0MXF2ABp1vJd9dnksKntBYa88a0rWHbx0W2BoYvcA6oY2ZhdHruSp4bSdEKu7xHsKXr1Mv/kgPchHKa2nq1c860jOlq1+n2r9Lsis6l2VT/0HXca6xRpGlhCxxII1uu6NTtpvuEK/OSz+rjvOBmGYRiGYRiGYURO/gCvAxqEiHXGvgAAAABJRU5ErkJggg=="
      />
    </Defs>
  </Svg>
);
export default CalenderSvg;
